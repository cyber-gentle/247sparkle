'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { toast } from 'sonner';

// Zod schemas for each step
const step1Schema = z.object({
  serviceType: z.enum(['LAUNDRY', 'HOME_CLEANING', 'FUMIGATION'], {
    message: 'Please select a service type',
  }),
});

const step2Schema = z.object({
  items: z
    .array(
      z.object({
        id: z.string(),
        quantity: z.number().min(1, 'Quantity must be at least 1'),
      })
    )
    .min(1, 'Please select at least one item'),
});

const step3Schema = z.object({
  pickupOption: z.enum(['HOME_PICKUP', 'PARTNER_DROPOFF'], {
    message: 'Please select a pickup option',
  }),
});

const step4Schema = z.object({
  address: z.string().min(5, 'Address is required'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  desiredDeliveryDate: z.string().min(1, 'Delivery date is required'),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;
type Step4Data = z.infer<typeof step4Schema>;

interface PricingItem {
  id: string;
  itemName: string;
  serviceType: string;
  unitPrice: number;
}

export default function CustomerNewOrderPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [pricingData, setPricingData] = useState<PricingItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Map<string, number>>(new Map());
  const [orderSummary, setOrderSummary] = useState({
    serviceType: '',
    items: [] as any[],
    pickupOption: '',
    address: '',
    deliveryDate: '',
    totalPrice: 0,
  });

  // Fetch pricing data on mount
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await fetch('/api/pricing');
        if (!response.ok) throw new Error('Failed to fetch pricing');
        const data = await response.json();
        setPricingData(data.pricing ?? []);
      } catch (error) {
        toast.error('Failed to load pricing data');
      }
    };
    fetchPricing();
  }, []);

  // Step 1: Service Type Selection
  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
  });

  const onStep1Submit = (data: Step1Data) => {
    setOrderSummary((prev) => ({
      ...prev,
      serviceType: data.serviceType,
    }));
    if (data.serviceType === 'LAUNDRY') {
      setCurrentStep(2);
    } else {
      setCurrentStep(3);
    }
  };

  // Step 2: Item Selection (only for laundry)
  const onStep2Submit = () => {
    const selectedItemsArray = Array.from(selectedItems.entries()).map(([id, qty]) => {
      const item = pricingData.find((p) => p.id === id);
      return { id, itemName: item?.itemName || id, quantity: qty, unitPrice: item?.unitPrice || 0 };
    });
    const total = selectedItemsArray.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    setOrderSummary((prev) => ({
      ...prev,
      items: selectedItemsArray,
      totalPrice: total,
    }));
    setCurrentStep(3);
  };

  // Step 3: Pickup Option
  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
  });

  const onStep3Submit = (data: Step3Data) => {
    setOrderSummary((prev) => ({
      ...prev,
      pickupOption: data.pickupOption,
    }));
    setCurrentStep(4);
  };

  // Step 4: Delivery Details
  const step4Form = useForm<Step4Data>({
    resolver: zodResolver(step4Schema),
  });

  const onStep4Submit = (data: Step4Data) => {
    setOrderSummary((prev) => ({
      ...prev,
      address: data.address,
      deliveryDate: data.desiredDeliveryDate,
    }));
    setCurrentStep(5);
  };

  // Step 5: Confirm and Submit Order
  const submitOrder = async () => {
    setIsLoading(true);
    try {
      const payload = {
        serviceType: orderSummary.serviceType,
        items: orderSummary.items.map((item) => ({
          itemName: item.itemName,
          quantity: item.quantity,
          isWhiteGroup: false,
        })),
        pickupOption: orderSummary.pickupOption,
        deliveryAddress: orderSummary.address,
        scheduledDate: orderSummary.deliveryDate,
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create order');
      }

      toast.success('Order created successfully!');

      if (result.order?.paymentUrl) {
        window.location.href = result.order.paymentUrl;
      } else {
        router.push('/customer/orders');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create order');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${
                    step <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {step < currentStep ? <Check size={20} /> : step}
                </div>
                {step < 5 && (
                  <div
                    className={`h-1 flex-1 mx-2 ${
                      step < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Service Selection */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Select Service Type</h2>
            <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-4">
              {['LAUNDRY', 'HOME_CLEANING', 'FUMIGATION'].map((type) => (
                <label
                  key={type}
                  className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-blue-50"
                >
                  <input
                    {...step1Form.register('serviceType')}
                    type="radio"
                    value={type}
                    className="w-4 h-4"
                  />
                  <span className="ml-4 font-semibold text-gray-700">
                    {type === 'LAUNDRY' && 'Laundry Service'}
                    {type === 'HOME_CLEANING' && 'Home Cleaning'}
                    {type === 'FUMIGATION' && 'Fumigation'}
                  </span>
                </label>
              ))}
              {step1Form.formState.errors.serviceType && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle size={18} />
                  {step1Form.formState.errors.serviceType.message}
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
              >
                Next
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Item Selection (Laundry only) */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Select Items</h2>
            <div className="space-y-4 mb-6">
              {pricingData
                .filter((item) => item.serviceType === 'LAUNDRY')
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h3 className="font-semibold">{item.itemName}</h3>
                      <p className="text-gray-600">₦{item.unitPrice.toLocaleString()} per item</p>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={selectedItems.get(item.id) || 0}
                      onChange={(e) => {
                        const qty = parseInt(e.target.value) || 0;
                        const newItems = new Map(selectedItems);
                        if (qty > 0) newItems.set(item.id, qty);
                        else newItems.delete(item.id);
                        setSelectedItems(newItems);
                      }}
                      className="w-16 p-2 border rounded text-center"
                    />
                  </div>
                ))}
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400"
              >
                <ChevronLeft className="inline mr-2" size={18} /> Back
              </button>
              <button
                onClick={onStep2Submit}
                disabled={selectedItems.size === 0}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
              >
                Next <ChevronRight className="inline ml-2" size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Pickup Option */}
        {currentStep === 3 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Pickup Option</h2>
            <form onSubmit={step3Form.handleSubmit(onStep3Submit)} className="space-y-4">
              {['HOME_PICKUP', 'PARTNER_DROPOFF'].map((option) => (
                <label
                  key={option}
                  className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-blue-50"
                >
                  <input
                    {...step3Form.register('pickupOption')}
                    type="radio"
                    value={option}
                    className="w-4 h-4"
                  />
                  <span className="ml-4 font-semibold text-gray-700">
                    {option === 'HOME_PICKUP' && 'We Pick Up from Your Home'}
                    {option === 'PARTNER_DROPOFF' && "I'll Drop Off at Partner Location"}
                  </span>
                </label>
              ))}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(orderSummary.serviceType === 'LAUNDRY' ? 2 : 1)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold"
                >
                  <ChevronLeft className="inline mr-2" size={18} /> Back
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
                >
                  Next <ChevronRight className="inline ml-2" size={18} />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 4: Delivery Details */}
        {currentStep === 4 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Delivery Details</h2>
            <form onSubmit={step4Form.handleSubmit(onStep4Submit)} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Delivery Address</label>
                <textarea
                  {...step4Form.register('address')}
                  placeholder="Enter your delivery address"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
                {step4Form.formState.errors.address && (
                  <p className="text-red-600 text-sm mt-1">
                    {step4Form.formState.errors.address.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Desired Delivery Date</label>
                <input
                  {...step4Form.register('desiredDeliveryDate')}
                  type="date"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {step4Form.formState.errors.desiredDeliveryDate && (
                  <p className="text-red-600 text-sm mt-1">
                    {step4Form.formState.errors.desiredDeliveryDate.message}
                  </p>
                )}
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold"
                >
                  <ChevronLeft className="inline mr-2" size={18} /> Back
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
                >
                  Review Order <ChevronRight className="inline ml-2" size={18} />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 5: Order Summary & Confirmation */}
        {currentStep === 5 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Service Type</p>
                <p className="font-semibold text-lg">{orderSummary.serviceType}</p>
              </div>
              {orderSummary.items.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Items</p>
                  {orderSummary.items.map((item) => (
                    <p key={item.id} className="text-gray-700">
                    {item.itemName} × {item.quantity} = ₦{(item.unitPrice * item.quantity).toLocaleString()}
                  </p>
                  ))}
                </div>
              )}
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Pickup Option</p>
                <p className="font-semibold">{orderSummary.pickupOption}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-semibold">{orderSummary.address}</p>
              </div>
              <div className="p-4 bg-blue-50 border-2 border-blue-500 rounded-lg">
                <p className="text-sm text-gray-600">Total Price</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₦{orderSummary.totalPrice.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep(4)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold"
              >
                <ChevronLeft className="inline mr-2" size={18} /> Back
              </button>
              <button
                onClick={submitOrder}
                disabled={isLoading}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400"
              >
                {isLoading ? 'Processing...' : 'Proceed to Payment'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
