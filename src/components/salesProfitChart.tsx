import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface SalesProfitChartProps {
    data: {
        labels: string[];
        sales: number[];
        profit: number[];
    };
}

export default function SalesProfitChart({ data }: SalesProfitChartProps) {
    const chartData = {
        labels: data.labels,
        datasets: [
            {
                label: "Sales",
                data: data.sales,
                borderColor: "rgba(59, 130, 246, 1)", // Tailwind blue-500
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                fill: true,
                tension: 0.3,
            },
            {
                label: "Profit",
                data: data.profit,
                borderColor: "rgba(34, 197, 94, 1)", // Tailwind green-500
                backgroundColor: "rgba(34, 197, 94, 0.1)",
                fill: true,
                tension: 0.3,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "top" as const,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    };

    return <div className="relative w-full h-64 sm:h-80 md:h-80">
        <Line options={options} data={chartData} />
    </div>;
}  