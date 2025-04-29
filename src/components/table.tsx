// import { FiEdit, FiTrash2, FiArrowLeftCircle, FiArrowRightCircle } from "react-icons/fi";

// interface Column {
//     label: string;
//     key: string;
//     sortable?: boolean;
//     render?: (item: any) => React.ReactNode;
//     onSort?: () => void;
// }

// interface TableProps {
//     data: any[];
//     columns: Column[];
//     currentPage: number;
//     rowsPerPage: number;
//     totalPages: number;
//     sortKey?: string;
//     sortOrder?: string;
//     onPageChange: (newPage: number) => void;
//     onRowsPerPageChange: (newLimit: number) => void;
//     onEdit: (item: any) => void;
//     onDelete: (id: number) => void;
// }

// export default function Table({
//     data,
//     columns,
//     currentPage,
//     rowsPerPage,
//     totalPages,
//     sortKey,
//     sortOrder,
//     onPageChange,
//     onRowsPerPageChange,
//     onEdit,
//     onDelete,
// }: TableProps) {
//     return (
//         <div className="overflow-x-auto">
//             <table className="table w-full table-zebra">
//                 <thead>
//                     <tr className="bg-base-100 text-base-content">
//                         <th>#</th>
//                         {columns.map((col) => (
//                             <th
//                                 key={col.key}
//                                 className={col.sortable ? "cursor-pointer" : ""}
//                                 onClick={col.sortable ? col.onSort : undefined}
//                             >
//                                 {col.label} {sortKey === col.key && (sortOrder === "asc" ? "↑" : "↓")}
//                             </th>
//                         ))}
//                         <th>Actions</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     {data.map((item, index) => (
//                         <tr key={item.id}>
//                             <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
//                             {columns.map((col) => (
//                                 <td key={col.key}>
//                                     {col.render ? col.render(item) : item[col.key] ?? "-"}
//                                 </td>
//                             ))}
//                             <td className="flex items-center space-x-2">
//                                 <FiEdit
//                                     className="text-warning cursor-pointer"
//                                     size={20}
//                                     onClick={() => onEdit(item)}
//                                 />
//                                 <FiTrash2
//                                     className="text-error cursor-pointer"
//                                     size={20}
//                                     onClick={() => onDelete(item.id)}
//                                 />
//                             </td>
//                         </tr>
//                     ))}
//                 </tbody>
//             </table>

//             {/* Pagination Controls */}
//             <div className="flex justify-between items-center mt-4">
//                 <div className="flex items-center">
//                     <span className="mr-2">Items per page:</span>
//                     <select
//                         className="select select-bordered"
//                         value={rowsPerPage}
//                         onChange={(e) => {
//                             onRowsPerPageChange(Number(e.target.value));
//                             onPageChange(1);
//                         }}
//                     >
//                         {[5, 10, 15, 20].map((size) => (
//                             <option key={size} value={size}>
//                                 {size}
//                             </option>
//                         ))}
//                     </select>
//                 </div>
//                 <span>Page {currentPage} of {totalPages}</span>
//                 <div>
//                     <button
//                         className="mr-4"
//                         onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
//                         disabled={currentPage === 1}
//                     >
//                         <FiArrowLeftCircle size={24} />
//                     </button>
//                     <button
//                         onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
//                         disabled={currentPage === totalPages}
//                     >
//                         <FiArrowRightCircle size={24} />
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// }