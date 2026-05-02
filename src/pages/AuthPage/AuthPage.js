import React from 'react';

const AuthPage = () => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-[600px] max-w-[96vw] bg-white rounded-[25px] px-10 py-5 flex flex-col items-center justify-center min-h-[500px]">

        {/* Icon + Title */}
        <div className="flex flex-col items-center justify-center">
          <div className="bg-[#16A34A] w-[100px] h-[100px] rounded-full flex items-center justify-center">
            <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 87.5C70.7107 87.5 87.5 70.7107 87.5 50C87.5 29.2893 70.7107 12.5 50 12.5C29.2893 12.5 12.5 29.2893 12.5 50C12.5 70.7107 29.2893 87.5 50 87.5Z" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M45.8333 33.3333V54.1667H66.6666" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="font-montserrat font-bold text-[20px] mt-5 mb-0 text-[#515151]">
            PENDING APPROVAL
          </h1>
        </div>

        {/* Info message */}
        <div className="w-[400px] max-w-full mt-5 text-center bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center p-5 rounded-lg min-h-[100px]">
          <p className="font-montserrat font-normal text-[16px] text-[#15803D] m-0 leading-relaxed">
            Akunmu sedang menunggu persetujuan dari staff mohon menunggu proses persetujuan atau beritahu langsung kepada kepala divisi Anda!
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
