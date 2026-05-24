import React, { useState } from 'react';
import { ArrowLeft, Pencil, X, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface NamaPanggilanScreenProps {
  onBack: () => void;
}

export function NamaPanggilanScreen({ onBack }: NamaPanggilanScreenProps) {
  const { registeredUser, setRegisteredUser } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(registeredUser?.username || 'PENGGUNA ARC');
  const [showToast, setShowToast] = useState(false);

  const handleSave = () => {
    if (registeredUser) {
      setRegisteredUser({ ...registeredUser, username: name });
    }
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
          <span className="text-[13px] font-medium leading-tight">Nickname saved successfully!</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-center relative py-4 shrink-0 bg-white shadow-sm z-10 w-full">
        <button onClick={onBack} className="absolute left-4 p-1 hover:bg-slate-50 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-slate-700" />
        </button>
        <h2 className="font-bold text-[16px] text-slate-800">Nickname</h2>
      </div>

      <div className="flex flex-col flex-1 pb-24 px-4 bg-white relative w-full overflow-y-auto scrollbar-hide">
        <div className="pt-6 pb-6 text-center w-full">
          <p className="text-[14px] text-slate-600 leading-[1.6]">
            We will greet you on the Home screen with your chosen name.
          </p>
        </div>

        {!isEditing ? (
          <div 
            className="flex items-center justify-between px-4 py-4 bg-slate-50 border border-slate-200/60 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors shadow-sm"
            onClick={() => setIsEditing(true)}
          >
            <span className="font-bold text-[15px] text-slate-800 tracking-wide uppercase">{name}</span>
            <button className="text-[#3FA2F6]">
              <Pencil size={20} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col flex-1 w-full relative">
            <div className="w-full border border-slate-300 rounded-xl px-4 py-2 relative bg-white focus-within:border-[#3FA2F6] focus-within:ring-1 focus-within:ring-[#3FA2F6] transition-all group">
              <label className="text-[12px] font-medium text-slate-500 group-focus-within:text-[#3FA2F6] transition-colors">Nickname</label>
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
                onClick={() => setName('PENGGUNA ARC')}
                className="w-max mt-3 border border-[#3FA2F6] text-[#3FA2F6] px-3 py-1.5 rounded-full text-[12px] font-bold hover:bg-blue-50 transition-colors"
              >
                Use Full Name
              </button>
            </div>

            <div className="mt-auto pt-6 pb-2 w-full">
              <button 
                onClick={handleSave}
                disabled={name.length === 0}
                className="w-full bg-[#0066b2] hover:bg-[#005a9e] disabled:bg-slate-300 disabled:text-slate-50 text-white font-bold py-3.5 rounded-full transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
