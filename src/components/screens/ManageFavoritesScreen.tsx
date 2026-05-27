import React, { useState } from "react";
import { IconRenderer } from "../common/IconRenderer";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import { ShortcutItem } from "../../types";

export const defaultSelectedShortcuts: ShortcutItem[] = [
  { id: "1", icon: "Send", label: "Transfer USDC", color: "text-slate-600" },
  {
    id: "2",
    icon: "ArrowLeftRight",
    label: "Swap USDC",
    color: "text-orange-500",
    badge: "HOT",
  },
  {
    id: "3",
    icon: "QrCode",
    label: "Receive USDC",
    color: "text-slate-800",
  },
  {
    id: "13",
    icon: "Landmark",
    label: "Withdraw",
    color: "text-red-500",
  },
  {
    id: "14",
    icon: "Layers",
    label: "Bridge USDC",
    color: "text-indigo-600",
    badge: "NEW",
  },
  {
    id: "12",
    icon: "ShieldCheck",
    label: "Staking Pool",
    color: "text-emerald-500",
    badge: "NEW",
  },
];

export const defaultAvailableShortcuts: ShortcutItem[] = [
  {
    id: "11",
    icon: "Receipt",
    label: "Transaction History",
    color: "text-slate-600",
  },
];

export function ManageFavoritesScreen({
  onBack,
  onSave,
  initialSelected,
  initialAvailable,
}: {
  onBack: () => void;
  onSave: (selected: ShortcutItem[], available: ShortcutItem[]) => void;
  initialSelected: ShortcutItem[];
  initialAvailable: ShortcutItem[];
}) {
  const [selected, setSelected] = useState<ShortcutItem[]>(initialSelected);
  const [available, setAvailable] = useState<ShortcutItem[]>(initialAvailable);

  const handleRemove = (item: ShortcutItem) => {
    setSelected((prev) => prev.filter((i) => i.id !== item.id));
    setAvailable((prev) => [...prev, item]);
  };

  const handleAdd = (item: ShortcutItem) => {
    if (selected.length >= 9) return;
    setAvailable((prev) => prev.filter((i) => i.id !== item.id));
    setSelected((prev) => [...prev, item]);
  };

  const isSaveDisabled = selected.length === 0;

  return (
    <div className="w-full h-full bg-white relative flex flex-col z-50 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center px-4 pt-6 pb-3 bg-slate-900 shadow-md relative z-10 w-full justify-between">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20 cursor-pointer border-0 bg-transparent"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h2 className="font-bold text-[16px] text-white ml-2">
            MANAGE MENUS
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full scrollbar-hide pb-24">
        <div className="px-5 text-center mt-2 mb-6">
          <p className="text-[14px] text-slate-600">
            Select 9 asset transaction menus that you use most frequently.
          </p>
        </div>

        <div className="px-4">
          {/* Selected Grid */}
          <div className="grid grid-cols-4 gap-y-6 gap-x-2 mb-6">
            {selected.map((item) => (
              <div
                key={item.id}
                className="flex flex-col items-center gap-2 cursor-pointer group w-full"
                onClick={() => handleRemove(item)}
              >
                <div className="relative">
                  <div
                    className={`w-[52px] h-[52px] rounded-full border border-[#f1f5f9] flex flex-col items-center justify-center shrink-0 shadow-sm relative ${item.bgCircle || "bg-white"}`}
                  >
                    <div className={item.color}>
                      <IconRenderer name={item.icon} size={24} />
                    </div>
                    {item.isTextIcon && (
                      <span
                        className={`text-[8px] font-bold -mt-0.5 ${item.color}`}
                      >
                        {item.textIcon}
                      </span>
                    )}
                  </div>

                  {/* Minus Badge */}
                  <div className="absolute -top-1 -right-1 w-[20px] h-[20px] bg-red-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10 transition-transform group-active:scale-95">
                    <Minus size={12} strokeWidth={4} className="text-white" />
                  </div>

                  {item.badge && (
                    <div
                      className={`absolute -top-1 right-3 ${item.badgeColor || "bg-green-500"} text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-white shadow-sm z-0`}
                    >
                      {item.badge}
                    </div>
                  )}
                </div>
                <span className="text-[11px] font-medium text-slate-700 text-center leading-[1.1] ">
                  {item.label}
                </span>
              </div>
            ))}

            {/* Empty slots placeholders */}
            {Array.from({ length: Math.max(0, 9 - selected.length) }).map(
              (_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="flex flex-col items-center gap-2 w-full opacity-60"
                >
                  <div className="w-[52px] h-[52px] rounded-full bg-slate-100 flex items-center justify-center shrink-0"></div>
                </div>
              ),
            )}
          </div>

          <div className="w-full h-[1px] bg-slate-100 my-6"></div>

          {/* Available Grid */}
          <div className="grid grid-cols-4 gap-y-6 gap-x-2 pb-6">
            {available.map((item) => (
              <div
                key={item.id}
                className={`flex flex-col items-center gap-2 cursor-pointer group w-full ${selected.length >= 9 ? "opacity-50 grayscale" : ""}`}
                onClick={() => {
                  if (selected.length < 9) handleAdd(item);
                }}
              >
                <div className="relative w-max">
                  <div
                    className={`w-[52px] h-[52px] rounded-full border border-[#f1f5f9] flex flex-col items-center justify-center shrink-0 shadow-sm transition-colors ${item.bgCircle || "bg-white"}`}
                  >
                    <div className={item.color}>
                      <IconRenderer name={item.icon} size={24} />
                    </div>
                    {item.isTextIcon && (
                      <span
                        className={`text-[8px] font-bold -mt-0.5 ${item.color}`}
                      >
                        {item.textIcon}
                      </span>
                    )}
                  </div>

                  {/* Plus Badge */}
                  <div className="absolute -top-1 -right-1 w-[20px] h-[20px] bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10 transition-transform group-active:scale-95">
                    <Plus size={12} strokeWidth={4} className="text-white" />
                  </div>
                </div>
                <span className="text-[11px] font-medium text-slate-700 text-center leading-[1.1]">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white/95 backdrop-blur-md px-5 pb-5 pt-4 absolute bottom-0 w-full z-30 shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
        <button
          onClick={() => {
            if (!isSaveDisabled) onSave(selected, available);
          }}
          disabled={isSaveDisabled}
          className={`w-full py-3.5 rounded-full font-bold text-[15px] transition-all
            ${
              isSaveDisabled
                ? "bg-slate-200 text-slate-400"
                : "bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]"
            }
          `}
        >
          Save
        </button>
      </div>
    </div>
  );
}
