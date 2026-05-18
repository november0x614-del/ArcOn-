import React, { useState } from 'react';
import { Pencil, ArrowLeft, X, Check } from 'lucide-react';

export function NamaPanggilanScreen({ onBack }: { onBack: () => void }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [name, setName] = React.useState('RAKYAN INUKERTAPATI');
  const [showToast, setShowToast] = React.useState(false);

  const handleSave = () => {
    setIsEditing(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="w-full h-full bg-[#f8fafc] relative flex flex-col z-50 animate-in slide-in-from-right duration-300">
      {/* Toast Notification */}
      {showToast && (
        <div className="absolute top-4 left-4 right-4 bg-[#2b2b2b] text-white px-4 py-3 rounded-xl flex items-center z-50 animate-in fade-in slide-in-from-top-4 shadow-lg">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3 shrink-0">
            <Check size={12} className="text-white" strokeWidth={3} />
          </div>
          <span className="text-[13px] font-medium leading-tight">Nama panggilan berhasil disimpan!</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-center relative py-4 shrink-0 bg-white shadow-sm z-10 w-full">
        <button onClick={onBack} className="absolute left-4 p-1 hover:bg-slate-50 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-slate-700" />
        </button>
        <h2 className="font-bold text-[16px] text-slate-800">Nama Panggilan</h2>
      </div>

      <div className="flex flex-col flex-1 pb-6 px-4 bg-white relative w-full">
        <div className="pt-6 pb-6 text-center w-full">
          <p className="text-[14px] text-slate-600 leading-[1.6]">
            Kami akan menyapa Anda di Beranda dengan nama yang Anda tentukan.
          </p>
        </div>

        {!isEditing ? (
          <div 
            className="flex items-center justify-between px-4 py-4 bg-slate-50 border border-slate-200/60 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors shadow-sm"
            onClick={() => setIsEditing(true)}
          >
            <span className="font-bold text-[15px] text-slate-800 tracking-wide uppercase">{name}</span>
            <button className="text-[#6366f1]">
              <Pencil size={20} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col flex-1 w-full relative">
            <div className="w-full border border-slate-300 rounded-xl px-4 py-2 relative bg-white focus-within:border-[#6366f1] focus-within:ring-1 focus-within:ring-[#6366f1] transition-all group">
              <label className="text-[12px] font-medium text-slate-500 group-focus-within:text-[#6366f1] transition-colors">Nama Panggilan</label>
              <div className="flex items-center">
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => {
                    if (e.target.value.length <= 16) {
                      setName(e.target.value.toUpperCase());
                    }
                  }}
                  className="w-full bg-transparent border-none outline-none font-bold text-[16px] text-slate-800 uppercase pb-1"
                  autoFocus
                />
                {name.length > 0 && (
                  <button onClick={() => setName('')} className="bg-slate-200 text-slate-500 rounded-full p-0.5 ml-2 mt-1 shrink-0">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex flex-col mt-2.5 px-1 items-start w-full">
              <span className="text-[12px] text-slate-500 font-medium">{name.length}/16</span>
              <button 
                onClick={() => setName('RAKYAN INUKERTAPATI')}
                className="w-max mt-3 border border-[#6366f1] text-[#6366f1] px-3 py-1.5 rounded-full text-[12px] font-bold hover:bg-indigo-50 transition-colors"
              >
                Pakai Nama Lengkap
              </button>
            </div>

            <div className="mt-auto pt-6 pb-2 w-full">
              <button 
                onClick={handleSave}
                disabled={name.length === 0}
                className="w-full bg-[#4338ca] hover:bg-[#3730a3] disabled:bg-slate-300 disabled:text-slate-50 text-white font-bold py-3.5 rounded-full transition-colors"
              >
                Simpan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

