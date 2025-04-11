import React from 'react';

const DeleteConfirmModal = ({ 
  show,
  title,
  message,
  confirmButtonText = 'Delete',
  onCancel,
  onConfirm,
  isLoading = false
}) => {
  if (!show) return null;

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md overflow-hidden">
        <div className="p-6">
          <h2 className="mb-2 font-bold text-gray-900 text-xl">{title}</h2>
          <p className="mb-6 text-gray-600">{message}</p>
          
          <div className="flex space-x-3">
            <button
              type="button"
              className="bg-gray-200 hover:bg-gray-300 py-2 rounded-lg w-1/2 text-gray-800 transition duration-200"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 py-2 rounded-lg w-1/2 text-white transition duration-200"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : confirmButtonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;