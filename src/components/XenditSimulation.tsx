import React, { useState, useEffect, useRef } from 'react'
import { X, ShieldCheck, Clock, CreditCard, Smartphone, QrCode, ChevronRight, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface XenditSimulationProps {
  amount: number
  programTitle: string
  onSuccess: () => void
  onClose: () => void
}

const XenditSimulation: React.FC<XenditSimulationProps> = ({ amount, programTitle, onSuccess, onClose }) => {
  const [step, setStep] = useState<'methods' | 'details' | 'success'>('methods')
  const [selectedMethod, setSelectedMethod] = useState<any>(null)
  const [timeLeft, setTimeLeft] = useState(24 * 60 * 60) // 24 hours in seconds
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    const timer = setInterval(() => {
      if (isMounted.current) {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
      }
    }, 1000)
    
    return () => {
      isMounted.current = false
      clearInterval(timer)
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current)
    }
  }, [])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price)
  }

  const methods = [
    { id: 'bca', name: 'BCA', category: 'Virtual Account', icon: CreditCard, color: 'text-blue-600' },
    { id: 'mandiri', name: 'Mandiri', category: 'Virtual Account', icon: CreditCard, color: 'text-blue-800' },
    { id: 'bni', name: 'BNI', category: 'Virtual Account', icon: CreditCard, color: 'text-orange-600' },
    { id: 'gopay', name: 'GoPay', category: 'E-Wallet', icon: Smartphone, color: 'text-blue-500' },
    { id: 'ovo', name: 'OVO', category: 'E-Wallet', icon: Smartphone, color: 'text-purple-600' },
    { id: 'qris', name: 'QRIS', category: 'QR Code', icon: QrCode, color: 'text-pink-600' },
  ]

  const handleMethodSelect = (method: any) => {
    setSelectedMethod(method)
    setStep('details')
  }

  const handleSimulatePayment = () => {
    setStep('success')
    successTimeoutRef.current = setTimeout(() => {
      if (isMounted.current) {
        onSuccess()
      }
    }, 2000)
  }

  return (
    <div className="fixed inset-0 bg-slate-900/70 z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Xendit Header Simulation */}
        <div className="bg-[#0052FF] p-4 flex items-center justify-between text-white flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-[#0052FF] font-black text-xl">X</span>
            </div>
            <span className="font-bold tracking-tight">Xendit <span className="font-normal opacity-80 text-xs ml-1">Simulation</span></span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {step === 'methods' && (
            <div className="p-6">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Penerima</p>
                  <h2 className="text-lg font-bold text-gray-900">Sertifikasi Kampus</h2>
                  <p className="text-sm text-gray-500">{programTitle}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Total</p>
                  <p className="text-xl font-black text-[#0052FF]">{formatPrice(amount)}</p>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3 mb-8 border border-blue-100">
                <Clock className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-xs text-blue-800 font-medium">Batas Waktu Pembayaran</p>
                  <p className="text-sm font-bold text-blue-900">{formatTime(timeLeft)}</p>
                </div>
                <ShieldCheck className="w-5 h-5 text-green-600" />
              </div>

              <h3 className="font-bold text-gray-900 mb-4">Pilih Metode Pembayaran</h3>
              <div className="space-y-3">
                {['Virtual Account', 'E-Wallet', 'QR Code'].map((cat) => (
                  <div key={cat} className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{cat}</p>
                    {methods.filter(m => m.category === cat).map(method => (
                      <button
                        key={method.id}
                        onClick={() => handleMethodSelect(method)}
                        className="w-full flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-white transition-colors`}>
                            <method.icon className={`w-5 h-5 ${method.color}`} />
                          </div>
                          <span className="font-semibold text-gray-700">{method.name}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'details' && (
            <div className="p-6 animate-fade-in">
              <button
                onClick={() => setStep('methods')}
                className="text-sm text-blue-600 font-semibold mb-6 flex items-center gap-1 hover:underline"
              >
                ← Ganti Metode Pembayaran
              </button>

              <div className="text-center mb-8">
                <div className={`w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4`}>
                  <selectedMethod.icon className={`w-8 h-8 ${selectedMethod.color}`} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Bayar dengan {selectedMethod.name}</h2>
                <p className="text-sm text-gray-500 mt-1">Gunakan nomor Virtual Account di bawah ini</p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-center border border-gray-100">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">Nomor Virtual Account</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-2xl font-black text-gray-900 tracking-widest">8801 0812 3456 78</p>
                  <button onClick={() => toast.success('Salin berhasil')} className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded">SALIN</button>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Jumlah Tagihan</span>
                  <span className="text-sm font-bold text-gray-900">{formatPrice(amount)}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Admin</span>
                  <span className="text-sm font-bold text-green-600">Gratis</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-sm text-gray-900 font-bold">Total Pembayaran</span>
                  <span className="text-lg font-black text-[#0052FF]">{formatPrice(amount)}</span>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-xl p-4 mb-8 border border-yellow-100">
                <p className="text-xs text-yellow-800 leading-relaxed font-medium">
                  <strong>Instruksi:</strong> Masuk ke m-banking Anda, pilih menu Transfer Virtual Account, lalu masukkan nomor di atas.
                </p>
              </div>

              <button
                onClick={handleSimulatePayment}
                className="w-full py-4 bg-[#0052FF] text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                Simulasi Bayar Berhasil
              </button>
            </div>
          )}

          {step === 'success' && (
            <div className="p-12 text-center animate-fade-in flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 animate-bounce">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Pembayaran Berhasil!</h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Terima kasih. Pembayaran Anda untuk <strong>{programTitle}</strong> telah kami terima.
              </p>
              <div className="w-full bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-8">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Status</span>
                  <span className="text-green-600 font-bold uppercase">Success</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Waktu</span>
                  <span className="text-gray-900 font-medium">{new Date().toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Metode</span>
                  <span className="text-gray-900 font-medium">{selectedMethod?.name}</span>
                </div>
              </div>
              <p className="text-xs text-gray-400">Anda akan diarahkan kembali sebentar lagi...</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-2 flex-shrink-0">
          <ShieldCheck className="w-4 h-4 text-green-600" />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Secured by Xendit Simulation</span>
        </div>
      </div>
    </div>
  )
}

export default XenditSimulation
