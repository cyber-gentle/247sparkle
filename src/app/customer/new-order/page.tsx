'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { isWhiteGroupItem, laundryPickupSchema } from '@/lib/laundry-order';

// Zod schemas for each step
const step1Schema = z.object({
  serviceType: z.enum(['LAUNDRY', 'HOME_CLEANING', 'FUMIGATION'], {
    message: 'Please select a service type',
  }),
});

const laundryDeliverySchema = z.object({
  address: z.string().min(5, 'Delivery address must be at least 5 characters'),
  // Required for PARTNER_DROPOFF only (checked in the submit handler).
  desiredDeliveryDate: z.string().optional(),
});

const fumigationDetailsSchema = z.object({
  address: z.string().min(5, 'Property address must be at least 5 characters'),
  serviceDate: z.string().min(1, 'Service date is required'),
  serviceTime: z.string().min(1, 'Service time slot is required'),
});

type Step1Data = z.infer<typeof step1Schema>;
type LaundryPickupData = z.infer<typeof laundryPickupSchema>;
type LaundryDeliveryData = z.infer<typeof laundryDeliverySchema>;
type FumigationDetailsData = z.infer<typeof fumigationDetailsSchema>;

interface PricingItem {
  id: string;
  itemName: string;
  serviceType: string;
  unitPrice: number;
  description?: string | null;
}

export default function CustomerNewOrderPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [pricingData, setPricingData] = useState<PricingItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Map<string, number>>(new Map());
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>('');

  const [orderSummary, setOrderSummary] = useState({
    serviceType: '',
    propertyType: '',
    items: [] as { id: string; itemName: string; quantity: number; unitPrice: number }[],
    pickupOption: '',
    pickupAddress: '',
    pickupDate: '',
    pickupTime: '',
    address: '',
    deliveryDate: '',
    scheduledTime: '09:00',
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
      } catch {
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
    if (data.serviceType === 'HOME_CLEANING') {
      toast.info('Home cleaning is priced per request — please request a quotation.');
      router.push('/contact');
      return;
    }

    setOrderSummary((prev) => ({
      ...prev,
      serviceType: data.serviceType,
      propertyType: '',
      items: [],
      totalPrice: 0,
    }));

    setCurrentStep(2);
  };

  // Step 2 Laundry: Item Selection
  const onLaundryItemsSubmit = () => {
    const selectedItemsArray = Array.from(selectedItems.entries()).map(([id, qty]) => {
      const item = pricingData.find((p) => p.id === id);
      return {
        id,
        itemName: item?.itemName || id,
        quantity: qty,
        unitPrice: item?.unitPrice || 0,
      };
    });
    const total = selectedItemsArray.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    setOrderSummary((prev) => ({
      ...prev,
      items: selectedItemsArray,
      totalPrice: total,
    }));
    setCurrentStep(3);
  };

  // Step 2 Fumigation: Property Selection
  const onFumigationPropertySubmit = () => {
    if (!selectedPropertyType) {
      toast.error('Please select a property type for fumigation');
      return;
    }
    const pricingItem = pricingData.find(
      (p) => p.serviceType === 'FUMIGATION' && p.itemName === selectedPropertyType
    );
    const price = pricingItem?.unitPrice || 0;

    setOrderSummary((prev) => ({
      ...prev,
      propertyType: selectedPropertyType,
      pickupOption: 'ON_SITE',
      totalPrice: price,
    }));
    setCurrentStep(3);
  };

  // Step 3 Laundry: Pickup Option
  const laundryPickupForm = useForm<LaundryPickupData>({
    resolver: zodResolver(laundryPickupSchema),
  });

  const onLaundryPickupSubmit = (data: LaundryPickupData) => {
    setOrderSummary((prev) => ({
      ...prev,
      pickupOption: data.pickupOption,
      pickupAddress: data.pickupOption === 'HOME_PICKUP' ? data.pickupAddress || '' : '',
      pickupDate: data.pickupOption === 'HOME_PICKUP' ? data.pickupDate || '' : '',
      pickupTime: data.pickupOption === 'HOME_PICKUP' ? data.pickupTime || '' : '',
    }));
    // Delivery defaults to the pickup address (editable in the next step).
    laundryDeliveryForm.reset({
      address: data.pickupOption === 'HOME_PICKUP' ? data.pickupAddress || '' : '',
    });
    setCurrentStep(4);
  };

  // Step 4 Laundry: Delivery Details
  const laundryDeliveryForm = useForm<LaundryDeliveryData>({
    resolver: zodResolver(laundryDeliverySchema),
  });

  const onLaundryDeliverySubmit = (data: LaundryDeliveryData) => {
    // For partner drop-off the only date the customer schedules is when they
    // want the items back, so it stays required on that path. Home pickup
    // already captured its own date/time in the previous step.
    if (orderSummary.pickupOption === 'PARTNER_DROPOFF' && !data.desiredDeliveryDate) {
      laundryDeliveryForm.setError('desiredDeliveryDate', {
        message: 'Preferred delivery date is required',
      });
      return;
    }
    setOrderSummary((prev) => ({
      ...prev,
      address: data.address,
      deliveryDate: data.desiredDeliveryDate || '',
    }));
    setCurrentStep(5);
  };

  // Step 3 Fumigation: Property Address & Schedule Details
  const fumigationDetailsForm = useForm<FumigationDetailsData>({
    resolver: zodResolver(fumigationDetailsSchema),
    defaultValues: {
      serviceTime: '09:00',
    },
  });

  const onFumigationDetailsSubmit = (data: FumigationDetailsData) => {
    setOrderSummary((prev) => ({
      ...prev,
      address: data.address,
      deliveryDate: data.serviceDate,
      scheduledTime: data.serviceTime,
      pickupOption: 'ON_SITE',
    }));
    setCurrentStep(4);
  };

  // Final Order Submission
  const submitOrder = async () => {
    setIsLoading(true);
    try {
      const isFumigation = orderSummary.serviceType === 'FUMIGATION';

      const payload = isFumigation
        ? {
            serviceType: 'FUMIGATION',
            propertyType: orderSummary.propertyType,
            pickupOption: 'ON_SITE',
            deliveryAddress: orderSummary.address,
            pickupAddress: orderSummary.address,
            scheduledDate: orderSummary.deliveryDate,
            scheduledTime: orderSummary.scheduledTime,
          }
        : {
            serviceType: 'LAUNDRY',
            items: orderSummary.items.map((item) => ({
              itemName: item.itemName,
              quantity: item.quantity,
              isWhiteGroup: isWhiteGroupItem(item.itemName),
            })),
            pickupOption: orderSummary.pickupOption,
            // Riders collect from the customer only on home pickup.
            pickupAddress:
              orderSummary.pickupOption === 'HOME_PICKUP' ? orderSummary.pickupAddress : undefined,
            deliveryAddress: orderSummary.address,
            // The order is scheduled around when it enters our custody:
            // pickup date/time for home pickup, preferred return date for
            // partner drop-off.
            scheduledDate:
              orderSummary.pickupOption === 'HOME_PICKUP'
                ? orderSummary.pickupDate
                : orderSummary.deliveryDate,
            scheduledTime:
              orderSummary.pickupOption === 'HOME_PICKUP' ? orderSummary.pickupTime : undefined,
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

  const isFumigation = orderSummary.serviceType === 'FUMIGATION';
  const totalSteps = isFumigation ? 4 : 5;

  const stepLabels = isFumigation
    ? ['Service', 'Property', 'Schedule', 'Review']
    : ['Service', 'Items', 'Pickup', 'Delivery', 'Review'];

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-[#CC0000] text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles size={14} /> Quick & Seamless Booking
          </div>
          <h1 className="text-3xl font-extrabold text-[#1A0A5E]">Create a New Order</h1>
          <p className="text-sm text-slate-500 mt-1">
            Choose your service and schedule professional care in minutes.
          </p>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="mb-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
              <div key={step} className="flex-1 flex items-center">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold text-sm transition-colors ${
                      step < currentStep
                        ? 'bg-emerald-600 text-white'
                        : step === currentStep
                          ? 'bg-[#1A0A5E] text-white shadow-md'
                          : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {step < currentStep ? <Check size={18} /> : step}
                  </div>
                  <span
                    className={`text-[11px] font-semibold mt-1.5 ${
                      step === currentStep ? 'text-[#1A0A5E]' : 'text-slate-400'
                    }`}
                  >
                    {stepLabels[step - 1]}
                  </span>
                </div>
                {step < totalSteps && (
                  <div
                    className={`h-0.5 flex-1 mb-5 transition-colors ${
                      step < currentStep ? 'bg-emerald-600' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* STEP 1: Service Selection */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
            <h2 className="text-xl font-bold text-[#1A0A5E] mb-2">Step 1: Select Service Type</h2>
            <p className="text-sm text-slate-500 mb-6">
              Select the service you require. Cleaning services require custom quotation.
            </p>

            <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-4">
              <label className="flex items-start p-4 border-2 rounded-xl cursor-pointer hover:border-[#1A0A5E] hover:bg-slate-50 transition-all group">
                <input
                  {...step1Form.register('serviceType')}
                  type="radio"
                  value="LAUNDRY"
                  className="w-4 h-4 mt-1 text-[#1A0A5E] focus:ring-[#1A0A5E]"
                />
                <div className="ml-4">
                  <span className="font-bold text-slate-800 group-hover:text-[#1A0A5E] flex items-center gap-2">
                    <Package size={16} className="text-[#CC0000]" /> Laundry & Dry Cleaning
                  </span>
                  <p className="text-xs text-slate-500 mt-1">
                    Wash, iron, dry-cleaning with convenient home pickup and door-to-door delivery.
                  </p>
                </div>
              </label>

              <label className="flex items-start p-4 border-2 rounded-xl cursor-pointer hover:border-[#1A0A5E] hover:bg-slate-50 transition-all group">
                <input
                  {...step1Form.register('serviceType')}
                  type="radio"
                  value="FUMIGATION"
                  className="w-4 h-4 mt-1 text-[#1A0A5E] focus:ring-[#1A0A5E]"
                />
                <div className="ml-4">
                  <span className="font-bold text-slate-800 group-hover:text-[#1A0A5E] flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-600" /> Fumigation & Pest Control
                  </span>
                  <p className="text-xs text-slate-500 mt-1">
                    Certified on-site pest eradication with an official verifiable fumigation
                    certificate.
                  </p>
                </div>
              </label>

              <label className="flex items-start p-4 border-2 rounded-xl cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition-all group opacity-85">
                <input
                  {...step1Form.register('serviceType')}
                  type="radio"
                  value="HOME_CLEANING"
                  className="w-4 h-4 mt-1 text-[#1A0A5E] focus:ring-[#1A0A5E]"
                />
                <div className="ml-4">
                  <span className="font-bold text-slate-700 flex items-center gap-2">
                    <Sparkles size={16} className="text-[#F5C200]" /> Home / Office Cleaning
                  </span>
                  <p className="text-xs text-slate-500 mt-1">
                    Deep cleaning tailored to your space. (Priced on request via quotation form).
                  </p>
                </div>
              </label>

              {step1Form.formState.errors.serviceType && (
                <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
                  <AlertCircle size={16} />
                  {step1Form.formState.errors.serviceType.message}
                </div>
              )}

              <button
                type="submit"
                className="w-full mt-4 bg-[#1A0A5E] text-white py-3 rounded-xl font-bold hover:bg-[#120843] transition-colors flex items-center justify-center gap-2"
              >
                Continue <ChevronRight size={18} />
              </button>
            </form>
          </div>
        )}

        {/* STEP 2 (LAUNDRY): Item Selection */}
        {currentStep === 2 && !isFumigation && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
            <h2 className="text-xl font-bold text-[#1A0A5E] mb-2">Step 2: Select Laundry Items</h2>
            <p className="text-sm text-slate-500 mb-6">
              Select the clothes and items you would like cleaned.
            </p>

            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto pr-1">
              {pricingData
                .filter((item) => item.serviceType === 'LAUNDRY')
                .map((item) => {
                  const qty = selectedItems.get(item.id) || 0;
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-4 border rounded-xl transition-all ${
                        qty > 0
                          ? 'border-[#1A0A5E] bg-blue-50/40'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">{item.itemName}</h3>
                        <p className="text-xs font-semibold text-[#CC0000]">
                          ₦{item.unitPrice.toLocaleString()} each
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const newMap = new Map(selectedItems);
                            if (qty > 1) {
                              newMap.set(item.id, qty - 1);
                            } else {
                              newMap.delete(item.id);
                            }
                            setSelectedItems(newMap);
                          }}
                          className="w-8 h-8 rounded-lg border border-slate-300 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-100"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-bold text-sm text-slate-800">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const newMap = new Map(selectedItems);
                            newMap.set(item.id, qty + 1);
                            setSelectedItems(newMap);
                          }}
                          className="w-8 h-8 rounded-lg bg-[#1A0A5E] text-white font-bold flex items-center justify-center hover:bg-[#120843]"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-1"
              >
                <ChevronLeft size={18} /> Back
              </button>
              <button
                type="button"
                onClick={onLaundryItemsSubmit}
                disabled={selectedItems.size === 0}
                className="flex-1 bg-[#1A0A5E] text-white py-3 rounded-xl font-bold hover:bg-[#120843] disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
              >
                Next Step <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 (FUMIGATION): Property Type Selection */}
        {currentStep === 2 && isFumigation && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
            <h2 className="text-xl font-bold text-[#1A0A5E] mb-2">Step 2: Choose Property Type</h2>
            <p className="text-sm text-slate-500 mb-6">
              Select the size and layout of the property to be fumigated.
            </p>

            <div className="space-y-3 mb-6">
              {pricingData
                .filter((item) => item.serviceType === 'FUMIGATION')
                .map((item) => {
                  const isSelected = selectedPropertyType === item.itemName;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedPropertyType(item.itemName)}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-[#1A0A5E] bg-purple-50/50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? 'border-[#1A0A5E] bg-[#1A0A5E]'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm md:text-base">
                            {item.itemName}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {item.description || 'Full indoor and perimeter pest extermination'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-[#1A0A5E] text-base">
                          ₦{item.unitPrice.toLocaleString()}
                        </span>
                        <span className="block text-[10px] uppercase tracking-wider text-emerald-700 font-bold">
                          Cert. Included
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-1"
              >
                <ChevronLeft size={18} /> Back
              </button>
              <button
                type="button"
                onClick={onFumigationPropertySubmit}
                disabled={!selectedPropertyType}
                className="flex-1 bg-[#1A0A5E] text-white py-3 rounded-xl font-bold hover:bg-[#120843] disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
              >
                Next Step <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 (LAUNDRY): Pickup Option */}
        {currentStep === 3 && !isFumigation && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
            <h2 className="text-xl font-bold text-[#1A0A5E] mb-2">Step 3: Choose Pickup Option</h2>
            <p className="text-sm text-slate-500 mb-6">
              How would you like us to receive your laundry?
            </p>

            <form
              onSubmit={laundryPickupForm.handleSubmit(onLaundryPickupSubmit)}
              className="space-y-4"
            >
              {['HOME_PICKUP', 'PARTNER_DROPOFF'].map((option) => (
                <label
                  key={option}
                  className="flex items-start p-4 border-2 rounded-xl cursor-pointer hover:border-[#1A0A5E] hover:bg-slate-50 transition-all group"
                >
                  <input
                    {...laundryPickupForm.register('pickupOption')}
                    type="radio"
                    value={option}
                    className="w-4 h-4 mt-1 text-[#1A0A5E] focus:ring-[#1A0A5E]"
                  />
                  <div className="ml-4">
                    <span className="font-bold text-slate-800 group-hover:text-[#1A0A5E]">
                      {option === 'HOME_PICKUP'
                        ? 'Home Pickup (A dispatch rider picks up from your doorstep)'
                        : 'Partner Drop-off (You drop off at any verified partner location)'}
                    </span>
                  </div>
                </label>
              ))}

              {laundryPickupForm.formState.errors.pickupOption && (
                <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
                  <AlertCircle size={16} />
                  {laundryPickupForm.formState.errors.pickupOption.message}
                </div>
              )}

              {laundryPickupForm.watch('pickupOption') === 'HOME_PICKUP' && (
                <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <AddressAutocomplete
                      id="pickup-address"
                      label="Pickup Address"
                      value={laundryPickupForm.watch('pickupAddress') || ''}
                      onChange={(val) =>
                        laundryPickupForm.setValue('pickupAddress', val, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                      placeholder="Where should the rider collect your laundry?"
                      error={laundryPickupForm.formState.errors.pickupAddress?.message}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1">
                        <Calendar size={14} className="text-[#1A0A5E]" /> Pickup Date
                      </label>
                      <input
                        {...laundryPickupForm.register('pickupDate')}
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1A0A5E] focus:outline-none text-sm"
                      />
                      {laundryPickupForm.formState.errors.pickupDate && (
                        <p className="text-red-600 text-xs mt-1">
                          {laundryPickupForm.formState.errors.pickupDate.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1">
                        <Clock size={14} className="text-[#1A0A5E]" /> Pickup Time Window
                      </label>
                      <select
                        {...laundryPickupForm.register('pickupTime')}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1A0A5E] focus:outline-none text-sm bg-white"
                      >
                        <option value="">Select a time window</option>
                        <option value="09:00">Morning (09:00 AM – 12:00 PM)</option>
                        <option value="13:00">Afternoon (01:00 PM – 04:00 PM)</option>
                        <option value="16:00">Late Afternoon (04:00 PM – 06:00 PM)</option>
                      </select>
                      {laundryPickupForm.formState.errors.pickupTime && (
                        <p className="text-red-600 text-xs mt-1">
                          {laundryPickupForm.formState.errors.pickupTime.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-1"
                >
                  <ChevronLeft size={18} /> Back
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#1A0A5E] text-white py-3 rounded-xl font-bold hover:bg-[#120843] transition-colors flex items-center justify-center gap-1"
                >
                  Next Step <ChevronRight size={18} />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3 (FUMIGATION): Schedule & Property Address */}
        {currentStep === 3 && isFumigation && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
            <h2 className="text-xl font-bold text-[#1A0A5E] mb-2">Step 3: Schedule & Location</h2>
            <p className="text-sm text-slate-500 mb-4">
              Enter the exact address where the fumigation service will be performed.
            </p>

            {/* Info notice about certificate & on-site service */}
            <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3">
              <ShieldCheck className="text-blue-700 shrink-0 mt-0.5" size={20} />
              <p className="text-xs text-blue-900 leading-relaxed">
                <strong>On-Site Service Guarantee:</strong> Our certified fumigation team will visit
                your premises on the scheduled date. An official{' '}
                <strong>247Sparkle Fumigation Certificate</strong> will be issued to your account
                and publicly verifiable upon service completion.
              </p>
            </div>

            <form
              onSubmit={fumigationDetailsForm.handleSubmit(onFumigationDetailsSubmit)}
              className="space-y-4"
            >
              <div>
                <AddressAutocomplete
                  id="fumigation-address"
                  label="Property Address"
                  value={fumigationDetailsForm.watch('address') || ''}
                  onChange={(val) =>
                    fumigationDetailsForm.setValue('address', val, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                  placeholder="e.g. 12 Ochacho Avenue, Flat 3B, Otukpo, Benue State"
                  error={fumigationDetailsForm.formState.errors.address?.message}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1">
                    <Calendar size={14} className="text-[#1A0A5E]" /> Preferred Service Date
                  </label>
                  <input
                    {...fumigationDetailsForm.register('serviceDate')}
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1A0A5E] focus:outline-none text-sm"
                  />
                  {fumigationDetailsForm.formState.errors.serviceDate && (
                    <p className="text-red-600 text-xs mt-1">
                      {fumigationDetailsForm.formState.errors.serviceDate.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1">
                    <Clock size={14} className="text-[#1A0A5E]" /> Preferred Time Window
                  </label>
                  <select
                    {...fumigationDetailsForm.register('serviceTime')}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1A0A5E] focus:outline-none text-sm bg-white"
                  >
                    <option value="09:00">Morning (09:00 AM – 12:00 PM)</option>
                    <option value="13:00">Afternoon (01:00 PM – 04:00 PM)</option>
                    <option value="16:00">Late Afternoon (04:00 PM – 06:00 PM)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-1"
                >
                  <ChevronLeft size={18} /> Back
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#1A0A5E] text-white py-3 rounded-xl font-bold hover:bg-[#120843] transition-colors flex items-center justify-center gap-1"
                >
                  Review Order <ChevronRight size={18} />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 4 (LAUNDRY): Delivery Details */}
        {currentStep === 4 && !isFumigation && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
            <h2 className="text-xl font-bold text-[#1A0A5E] mb-2">Step 4: Delivery Details</h2>
            <p className="text-sm text-slate-500 mb-6">
              Where should we deliver your clean, fresh garments?
              {orderSummary.pickupOption === 'HOME_PICKUP' && ' Your pickup address is prefilled.'}
            </p>

            <form
              onSubmit={laundryDeliveryForm.handleSubmit(onLaundryDeliverySubmit)}
              className="space-y-4"
            >
              <div>
                <AddressAutocomplete
                  id="delivery-address"
                  label="Delivery Address"
                  value={laundryDeliveryForm.watch('address') || ''}
                  onChange={(val) =>
                    laundryDeliveryForm.setValue('address', val, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                  placeholder="Enter your delivery address in Otukpo"
                  error={laundryDeliveryForm.formState.errors.address?.message}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1">
                  <Calendar size={14} className="text-[#1A0A5E]" />
                  {orderSummary.pickupOption === 'PARTNER_DROPOFF'
                    ? 'Preferred Delivery Date'
                    : 'Preferred Delivery Date (optional)'}
                </label>
                <input
                  {...laundryDeliveryForm.register('desiredDeliveryDate')}
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1A0A5E] focus:outline-none text-sm"
                />
                {laundryDeliveryForm.formState.errors.desiredDeliveryDate && (
                  <p className="text-red-600 text-xs mt-1">
                    {laundryDeliveryForm.formState.errors.desiredDeliveryDate.message}
                  </p>
                )}
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-1"
                >
                  <ChevronLeft size={18} /> Back
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#1A0A5E] text-white py-3 rounded-xl font-bold hover:bg-[#120843] transition-colors flex items-center justify-center gap-1"
                >
                  Review Order <ChevronRight size={18} />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 4 (FUMIGATION) or STEP 5 (LAUNDRY): Review & Pay */}
        {((isFumigation && currentStep === 4) || (!isFumigation && currentStep === 5)) && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
            <h2 className="text-xl font-bold text-[#1A0A5E] mb-2">Order Review & Confirmation</h2>
            <p className="text-sm text-slate-500 mb-6">
              Review your service details before proceeding to secure payment via Paystack.
            </p>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Service Type
                  </p>
                  <p className="font-extrabold text-[#1A0A5E] text-base mt-0.5">
                    {isFumigation ? 'Fumigation & Pest Control' : 'Laundry & Dry Cleaning'}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                  {isFumigation ? 'On-Site Service' : orderSummary.pickupOption}
                </span>
              </div>

              {isFumigation ? (
                <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Property Type:</span>
                    <span className="font-bold text-slate-800">{orderSummary.propertyType}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Scheduled Date:</span>
                    <span className="font-bold text-slate-800">{orderSummary.deliveryDate}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Scheduled Time:</span>
                    <span className="font-bold text-slate-800">{orderSummary.scheduledTime}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Certificate:</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <ShieldCheck size={14} /> Official Verified Certificate
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Pickup:</span>
                    <span className="font-bold text-slate-800 text-right">
                      {orderSummary.pickupOption === 'HOME_PICKUP'
                        ? `Home pickup${orderSummary.pickupDate ? ` — ${orderSummary.pickupDate}` : ''}${orderSummary.pickupTime ? ` (${orderSummary.pickupTime})` : ''}`
                        : 'Partner drop-off'}
                    </span>
                  </div>
                  {orderSummary.deliveryDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Preferred return by:</span>
                      <span className="font-bold text-slate-800">{orderSummary.deliveryDate}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Selected Items:</span>
                    <span className="font-bold text-slate-800">
                      {orderSummary.items.length} item type
                      {orderSummary.items.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {orderSummary.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm text-slate-700">
                        <span>
                          {item.itemName} × {item.quantity}
                          {isWhiteGroupItem(item.itemName) && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              White
                            </span>
                          )}
                        </span>
                        <span className="font-semibold">
                          ₦{(item.unitPrice * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  {isFumigation ? 'Property Location' : 'Delivery Address'}
                </p>
                <p className="text-sm font-semibold text-slate-800 flex items-start gap-1.5">
                  <MapPin size={16} className="text-[#CC0000] shrink-0 mt-0.5" />
                  {orderSummary.address}
                </p>
                {!isFumigation && orderSummary.pickupOption === 'HOME_PICKUP' && (
                  <p className="text-xs font-semibold text-slate-600 flex items-start gap-1.5 mt-2">
                    <MapPin size={14} className="text-[#1A0A5E] shrink-0 mt-0.5" />
                    Pickup at: {orderSummary.pickupAddress}
                  </p>
                )}
              </div>

              <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-[#1A0A5E] rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Total Amount Due
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Includes all taxes and service charges
                  </p>
                </div>
                <p className="text-2xl font-black text-[#1A0A5E]">
                  ₦{orderSummary.totalPrice.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setCurrentStep(isFumigation ? 3 : 4)}
                className="flex-1 bg-slate-100 text-slate-700 py-3.5 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-1"
              >
                <ChevronLeft size={18} /> Back
              </button>
              <button
                type="button"
                onClick={submitOrder}
                disabled={isLoading}
                className="flex-1 bg-[#1A0A5E] text-white py-3.5 rounded-xl font-bold hover:bg-[#120843] disabled:opacity-50 transition-colors shadow-lg shadow-indigo-950/20 flex items-center justify-center gap-2"
              >
                {isLoading ? 'Initializing Paystack...' : 'Proceed to Payment'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
