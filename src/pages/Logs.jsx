import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    BarElement,
    CategoryScale,
    LinearScale,
    Legend,
    Tooltip
} from 'chart.js';

ChartJS.register(
    BarElement,
    CategoryScale,
    LinearScale,
    Legend,
    Tooltip
);

const Logs = ({ logs }) => {
    const [chartData, setChartData] = useState(null);
    const [responseTimeData, setResponseTimeData] = useState(null);
    const [dailyChartData, setDailyChartData] = useState(null);
    const [methodChartData, setMethodChartData] = useState(null);

    useEffect(() => {
        if (!logs || logs.length === 0) return;

        const counters = {
            status: {
                server1: { info: 0, warn: 0, error: 0 },
                server2: { info: 0, warn: 0, error: 0 }
            },
            responseTime: {
                server1: { fast: 0, medium: 0, slow: 0 },
                server2: { fast: 0, medium: 0, slow: 0 }
            },
            methods: {
                server1: { POST: 0, GET: 0 },
                server2: { POST: 0, GET: 0 }
            },
            daily: {
                server1: {},
                server2: {}
            }
        };

        logs.forEach(log => {
            const serverKey = log.server === 1 ? 'server1' : 'server2';

            // Contador por status
            if ([200, 201, 204].includes(log.status)) counters.status[serverKey].info++;
            else if ([300, 301, 302].includes(log.status)) counters.status[serverKey].warn++;
            else if (log.status >= 400) counters.status[serverKey].error++;

            // Tiempo de respuesta
            if (log.responseTime < 200) counters.responseTime[serverKey].fast++;
            else if (log.responseTime <= 500) counters.responseTime[serverKey].medium++;
            else counters.responseTime[serverKey].slow++;

            // Métodos HTTP
            if (log.method === 'POST') counters.methods[serverKey].POST++;
            else if (log.method === 'GET') counters.methods[serverKey].GET++;

            // Agrupar por fecha
            let dateString = 'Fecha desconocida';
            if (log.timestamp) {
                try {
                    const date = log.timestamp._seconds
                        ? new Date(log.timestamp._seconds * 1000)
                        : new Date(log.timestamp);
                    dateString = date.toISOString().split('T')[0];
                } catch (error) {
                    console.error("Error procesando fecha:", log.timestamp);
                }
            }

            counters.daily[serverKey][dateString] = (counters.daily[serverKey][dateString] || 0) + 1;
        });

        const labels = ['Servidor 1', 'Servidor 2'];

        setChartData({
            labels,
            datasets: [
                {
                    label: 'Info',
                    data: [counters.status.server1.info, counters.status.server2.info],
                    backgroundColor: 'rgba(54, 162, 235, 0.5)'
                },
                {
                    label: 'Warn',
                    data: [counters.status.server1.warn, counters.status.server2.warn],
                    backgroundColor: 'rgba(255, 205, 86, 0.5)'
                },
                {
                    label: 'Error',
                    data: [counters.status.server1.error, counters.status.server2.error],
                    backgroundColor: 'rgba(255, 99, 132, 0.5)'
                }
            ]
        });

        setResponseTimeData({
            labels,
            datasets: [
                {
                    label: 'Rápido (<200ms)',
                    data: [counters.responseTime.server1.fast, counters.responseTime.server2.fast],
                    backgroundColor: 'rgba(75, 192, 192, 0.5)'
                },
                {
                    label: 'Medio (200-500ms)',
                    data: [counters.responseTime.server1.medium, counters.responseTime.server2.medium],
                    backgroundColor: 'rgba(255, 159, 64, 0.5)'
                },
                {
                    label: 'Lento (>500ms)',
                    data: [counters.responseTime.server1.slow, counters.responseTime.server2.slow],
                    backgroundColor: 'rgba(153, 102, 255, 0.5)'
                }
            ]
        });

        setMethodChartData({
            labels,
            datasets: [
                {
                    label: 'POST',
                    data: [counters.methods.server1.POST, counters.methods.server2.POST],
                    backgroundColor: 'rgba(255, 99, 132, 0.5)'
                },
                {
                    label: 'GET',
                    data: [counters.methods.server1.GET, counters.methods.server2.GET],
                    backgroundColor: 'rgba(54, 162, 235, 0.5)'
                }
            ]
        });

        const allDates = [...new Set([
            ...Object.keys(counters.daily.server1),
            ...Object.keys(counters.daily.server2)
        ])].sort();

        setDailyChartData({
            labels: allDates,
            datasets: [
                {
                    label: 'Servidor 1',
                    data: allDates.map(date => counters.daily.server1[date] || 0),
                    backgroundColor: 'rgba(54, 162, 235, 0.5)'
                },
                {
                    label: 'Servidor 2',
                    data: allDates.map(date => counters.daily.server2[date] || 0),
                    backgroundColor: 'rgba(255, 159, 64, 0.5)'
                }
            ]
        });

    }, [logs]);

    return (
        <div className="p-4 grid gap-6">
            {chartData && (
                <div className="bg-white p-4 rounded shadow">
                    <h2 className="text-lg font-semibold mb-2">Logs por estado</h2>
                    <Bar data={chartData} />
                </div>
            )}
            {responseTimeData && (
                <div className="bg-white p-4 rounded shadow">
                    <h2 className="text-lg font-semibold mb-2">Tiempos de respuesta</h2>
                    <Bar data={responseTimeData} />
                </div>
            )}
            {methodChartData && (
                <div className="bg-white p-4 rounded shadow">
                    <h2 className="text-lg font-semibold mb-2">Métodos HTTP</h2>
                    <Bar data={methodChartData} />
                </div>
            )}
            {dailyChartData && (
                <div className="bg-white p-4 rounded shadow">
                    <h2 className="text-lg font-semibold mb-2">Logs por día</h2>
                    <Bar data={dailyChartData} />
                </div>
            )}
        </div>
    );
};

export default Logs;
