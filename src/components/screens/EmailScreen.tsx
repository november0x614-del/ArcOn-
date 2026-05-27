import React, { useState } from "react";
import { ArrowLeft, Pencil, X } from "lucide-react";
import { useApp } from "../../contexts/AppContext";

interface EmailScreenProps {
  onBack: () => void;
}

export function EmailScreen({ onBack }: EmailScreenProps) {
  const { registeredUser, setRegisteredUser } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState(
    registeredUser?.email || "rakyaninuk@gmail.com",
  );
  const [tempEmail, setTempEmail] = useState("");
  const [error, setError] = useState("");

  const handleVerify = () => {
    if (tempEmail === registeredUser?.email) {
      setError("Email is already registered");
    } else {
      if (registeredUser) {
        setRegisteredUser({ ...registeredUser, email: tempEmail });
      }
      setEmail(tempEmail);
      setIsEditing(false);
      setError("");
    }
  };

  const handleBack = () => {
    if (isEditing) {
      setIsEditing(false);
      setError("");
    } else {
      onBack();
    }
  };

  return (
    <div className="w-full h-full bg-[#f8fafc] relative flex flex-col z-50 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-center relative py-4 shrink-0 bg-white shadow-sm z-10 w-full">
        <button
          onClick={handleBack}
          className="absolute left-4 p-1 hover:bg-slate-50 rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h2 className="font-bold text-[16px] text-slate-800">
          {isEditing ? "Manage Email" : "Email"}
        </h2>
      </div>

      <div className="flex flex-col flex-1 pb-24 px-4 bg-white relative w-full overflow-y-auto scrollbar-hide">
        <div className="pt-6 pb-6 text-center w-full">
          <p className="text-[14px] text-slate-600 leading-[1.6]">
            {isEditing
              ? "All transaction notifications on Arc Wallet and your e-statements will be sent to the new email."
              : "We will send transaction notifications and account settings to your specified email."}
          </p>
        </div>

        {!isEditing ? (
          <div
            className="flex items-center justify-between px-4 py-4 bg-slate-50 border border-slate-200/60 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors shadow-sm"
            onClick={() => {
              setTempEmail(email);
              setIsEditing(true);
              setError("");
            }}
          >
            <span className="font-bold text-[15px] text-slate-800 tracking-wide">
              {email}
            </span>
            <button className="text-slate-800">
              <Pencil size={20} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col flex-1 w-full relative">
            <div
              className={`w-full border rounded-xl px-4 py-2 relative bg-white transition-all group ${error ? "border-[#db2e38]" : "border-slate-300 focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900"}`}
            >
              <label
                className={`text-[12px] font-medium transition-colors ${error ? "text-[#db2e38]" : "text-slate-500 group-focus-within:text-slate-800"}`}
              >
                Email
              </label>
              <div className="flex items-center mt-0.5">
                <input
                  type="email"
                  value={tempEmail}
                  onChange={(e) => {
                    setTempEmail(e.target.value);
                    setError("");
                  }}
                  className={`w-full bg-transparent border-none outline-none font-bold text-[16px] pb-1 ${error ? "text-[#db2e38]" : "text-slate-800"}`}
                  autoFocus
                />
                {tempEmail.length > 0 && (
                  <button
                    onClick={() => {
                      setTempEmail("");
                      setError("");
                    }}
                    className="bg-slate-200 text-slate-500 rounded-full p-0.5 ml-2 mt-1 shrink-0"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
            {error && (
              <span className="text-[#db2e38] text-[12px] font-medium mt-1.5 ml-1">
                {error}
              </span>
            )}

            <div className="mt-auto pt-6 pb-2 w-full">
              <button
                onClick={handleVerify}
                disabled={tempEmail.length === 0}
                className="w-full bg-[#0066b2] hover:bg-[#005a9e] disabled:bg-slate-300 disabled:text-slate-50 text-white font-bold py-3.5 rounded-full transition-colors"
              >
                Verify
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
