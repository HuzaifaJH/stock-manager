"use client";
import { useEffect, useState } from "react";

export default function ProductList() {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        fetch("/api/products")
            .then((res) => res.json())
            .then((data) => setProducts(data))
            .catch((error) => console.error("Error:", error));
    }, []);

    return (
        <div>
            <h2>Product List</h2>
            <ul>
                {products.map((product: any) => (
                    <li key={product.id}>{product.name} - ${product.price}</li>
                ))}
            </ul>
        </div>
    );
}