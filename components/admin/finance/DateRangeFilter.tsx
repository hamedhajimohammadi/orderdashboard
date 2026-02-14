'use client';

import { useState } from 'react';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import { useRouter, useSearchParams } from 'next/navigation';

export default function DateRangeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState<any>([]);

  const handleApply = () => {
    if (value.length === 2) {
      const start = value[0].toDate().toISOString().split('T')[0];
      const end = value[1].toDate().toISOString().split('T')[0];
      const params = new URLSearchParams(searchParams.toString());
      params.set('startDate', start);
      params.set('endDate', end);
      router.push(`?${params.toString()}`);
    }
  };

  const handleClear = () => {
    setValue([]);
    router.push('/admin/finance');
  };

  return (
    <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200">
      <span className="text-sm text-gray-500 px-2">فیلتر تاریخ:</span>
      <DatePicker
        value={value}
        onChange={setValue}
        range
        calendar={persian}
        locale={persian_fa}
        placeholder="انتخاب بازه زمانی"
        inputClass="p-2 text-sm outline-none w-48"
      />
      <button onClick={handleApply} className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
        اعمال
      </button>
      {searchParams.has('startDate') && (
        <button onClick={handleClear} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200">
          حذف
        </button>
      )}
    </div>
  );
}
