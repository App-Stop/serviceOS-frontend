import React, { useRef, useState } from 'react';
import { Users, Briefcase, Receipt, Upload, CheckCircle2 } from 'lucide-react';

const IMPORT_OPTIONS = [
  {
    id: 'customers',
    title: 'Customers',
    description: 'Import your customer list',
    icon: Users,
    accept: '.csv,.xlsx,.xls',
  },
  {
    id: 'jobs',
    title: 'Jobs',
    description: 'Import existing jobs history',
    icon: Briefcase,
    accept: '.csv,.xlsx,.xls',
  },
  {
    id: 'invoices',
    title: 'Invoice & Expenses',
    description: 'Import invoices & costs',
    icon: Receipt,
    accept: '.csv,.xlsx,.xls',
  },
];

export const ImportPanel = () => {
  const [activeImport, setActiveImport] = useState(null);
  const [importedStatus, setImportedStatus] = useState(null);
  const fileInputRef = useRef(null);

  const handleSelectOption = (opt) => {
    setActiveImport(opt);
    setImportedStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && activeImport) {
      setImportedStatus({
        type: activeImport.title,
        fileName: file.name,
      });
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex flex-col gap-1 items-start w-full">
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
          Import
        </h1>
        <p className="text-sm font-normal text-black-200">
          Import customers and other data from CSV or Excel
        </p>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept={activeImport?.accept || '.csv,.xlsx,.xls'}
      />

      <div className="bg-white border border-neutral-200 rounded-[30px] p-6 flex flex-col gap-6 w-full">
        <div className="flex flex-col gap-1 items-start w-full">
          <h2 className="text-base font-medium text-neutral-900">
            What do you want to import?
          </h2>
          <p className="text-xs font-normal text-black-200">
            Choose the type of data to import from a CSV or Excel file.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {IMPORT_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                className="bg-white border border-neutral-200 hover:border-neutral-900 transition-all rounded-[14px] p-4 flex flex-col gap-5 items-start text-left cursor-pointer group"
                onClick={() => handleSelectOption(opt)}
              >
                <div className="size-9 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-900 group-hover:bg-neutral-900 group-hover:text-white transition-colors shrink-0">
                  <Icon size={18} strokeWidth={2} />
                </div>

                <div className="flex flex-col gap-1 items-start">
                  <span className="text-sm font-medium text-neutral-900">
                    {opt.title}
                  </span>
                  <span className="text-xs font-normal text-black-200">
                    {opt.description}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {importedStatus && (
          <div className="mt-2 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800">
            <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
            <div className="flex flex-col text-xs">
              <span className="font-semibold text-sm">
                Imported {importedStatus.type} successfully!
              </span>
              <span>File: {importedStatus.fileName}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
