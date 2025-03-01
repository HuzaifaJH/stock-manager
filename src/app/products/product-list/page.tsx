"use client";
import { useEffect, useState } from "react";

interface Product {
    id: number;
    name: string;
    price: number;
    stock: number;
}

export default function ProductList() {
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products`)
            .then((res) => res.json())
            .then((data) => setProducts(data))
            .catch((error) => console.error("Error:", error));
    }, []);

    return (
        <div>
            <h2>Product List</h2>
            <ul>
                {products.map((product: Product) => (
                    <li key={product.id}>{product.name} - ${product.price}</li>
                ))}
            </ul>
        </div>
    );
}