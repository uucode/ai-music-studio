'use client';

export function DonateModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-4 max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-center text-gray-700 font-bold mb-3">选择支付方式</p>
        <div className="flex gap-2">
          <img src="/wechat-pay.jpg" alt="微信收款码" className="w-1/2 rounded-lg" />
          <img src="/alipay.jpg" alt="支付宝收款码" className="w-1/2 rounded-lg" />
        </div>
        <p className="text-center text-gray-600 text-sm mt-3">感谢支持！☕</p>
        <button
          onClick={onClose}
          className="w-full mt-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-xl text-gray-700"
        >
          关闭
        </button>
      </div>
    </div>
  );
}
