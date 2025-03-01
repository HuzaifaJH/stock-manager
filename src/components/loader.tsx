// import React from "react";

// const Loader: React.FC = () => {
//     return (
//         <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
//             <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
//         </div>
//     );
// };

// export default Loader;


import { BarLoader } from "react-spinners";

const Loader = () => {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <BarLoader className="text-primary" />
        </div>
    );
};

export default Loader;