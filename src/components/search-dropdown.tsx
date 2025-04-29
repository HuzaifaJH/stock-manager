import { useEffect, useRef, useState } from "react";

interface Item {
    id: number | string;
    name: string;
}

interface Props {
    placeholder: string;
    index: number;
    items: Item[];
    selectedItemId: number | "";
    onChange: (index: number, id: number) => void;
    required?: boolean;
}

export const SearchDropdown = ({
    placeholder,
    index,
    items,
    selectedItemId,
    onChange,
    required = false,
}: Props) => {
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const filtered = items.filter((i: { name: string; }) =>
        i.name.toLowerCase().includes(search.toLowerCase())
    );

    const selected = items.find((i: { id: string | number; }) => i.id === selectedItemId);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={ref} className="relative">
            <input
                type="text"
                className="input input-bordered w-full"
                // value={search || selected?.name || ""}
                value={search || selected?.name || ""}
                placeholder={placeholder}
                onFocus={() => setOpen(true)}
                onChange={(e) => setSearch(e.target.value)}
                required={required && !selectedItemId}
            />
            {open && (
                <ul className="absolute z-10 bg-white border w-full max-h-60 overflow-y-auto shadow-md mt-1">
                    {filtered.length > 0 ? (
                        filtered.map((item) => (
                            <li
                                key={item.id}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                onMouseDown={() => {
                                    setSearch(item.name);
                                    setOpen(false);
                                    onChange(index, Number(item.id));
                                }}
                            >
                                {item.name}
                            </li>
                        ))
                    ) : (
                        <li className="px-4 py-2 text-gray-400">No product found</li>
                    )}
                </ul>
            )}
        </div>
    );
};