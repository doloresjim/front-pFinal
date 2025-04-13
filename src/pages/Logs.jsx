import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Logs = () => {
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Datos de Logs',
            },
        },
        scales: {
            y: {
                beginAtZero: true
            }
        }
    };

    // Procesamiento de datos con useMemo para optimización
    const { chartData, responseTimeData, dailyChartData, methodChartData } = useMemo(() => {
        if (!logs || logs.length === 0) return {};

        // Inicializar contadores
        const counters = {
            status: { server1: { info: 0, warn: 0, error: 0 }, server2: { info: 0, warn: 0, error: 0 } },
            responseTime: { server1: { fast: 0, medium: 0, slow: 0 }, server2: { fast: 0, medium: 0, slow: 0 } },
            methods: { server1: { POST: 0, GET: 0 }, server2: { POST: 0, GET: 0 } },
            daily: { server1: {}, server2: {} }
        };

        logs.forEach(log => {
            const serverKey = log.server === 1 ? 'server1' : 'server2';
            
            // Procesar estados HTTP
            if ([200, 201, 204].includes(log.status)) counters.status[serverKey].info++;
            else if ([300, 301, 302].includes(log.status)) counters.status[serverKey].warn++;
            else if (log.status >= 400) counters.status[serverKey].error++;
            
            // Procesar tiempos de respuesta
            if (log.responseTime < 200) counters.responseTime[serverKey].fast++;
            else if (log.responseTime <= 500) counters.responseTime[serverKey].medium++;
            else counters.responseTime[serverKey].slow++;
            
            // Procesar métodos HTTP
            if (log.method === 'POST') counters.methods[serverKey].POST++;
            else if (log.method === 'GET') counters.methods[serverKey].GET++;
            
            // Procesar por fecha
            let dateString = 'Fecha desconocida';
            if (log.timestamp) {
                try {
                    const date = log.timestamp._seconds 
                        ? new Date(log.timestamp._seconds * 1000) 
                        : new Date(log.timestamp);
                    dateString = date.toISOString().split('T')[0];
                } catch (e) {
                    console.warn("Error procesando fecha:", log.timestamp);
                }
            }
            counters.daily[serverKey][dateString] = (counters.daily[serverKey][dateString] || 0) + 1;
        });

        // Preparar datos para gráficos
        const labels = ["Servidor 1", "Servidor 2"];
        
        // Gráfico de estados
        const statusChart = {
            labels,
            datasets: [
                { label: "Info", data: [counters.status.server1.info, counters.status.server2.info], backgroundColor: "rgba(54, 162, 235, 0.5)" },
                { label: "Warn", data: [counters.status.server1.warn, counters.status.server2.warn], backgroundColor: "rgba(255, 159, 64, 0.5)" },
                { label: "Error", data: [counters.status.server1.error, counters.status.server2.error], backgroundColor: "rgba(255, 99, 132, 0.5)" }
            ]
        };

        // Gráfico de tiempos de respuesta
        const timeChart = {
            labels,
            datasets: [
                { label: "Rápido (<200ms)", data: [counters.responseTime.server1.fast, counters.responseTime.server2.fast], backgroundColor: "rgba(75, 192, 192, 0.5)" },
                { label: "Medio (200-500ms)", data: [counters.responseTime.server1.medium, counters.responseTime.server2.medium], backgroundColor: "rgba(255, 205, 86, 0.5)" },
                { label: "Lento (>500ms)", data: [counters.responseTime.server1.slow, counters.responseTime.server2.slow], backgroundColor: "rgba(255, 99, 132, 0.5)" }
            ]
        };

        // Gráfico de métodos HTTP
        const methodChart = {
            labels,
            datasets: [
                { label: "POST", data: [counters.methods.server1.POST, counters.methods.server2.POST], backgroundColor: "rgba(54, 162, 235, 0.5)" },
                { label: "GET", data: [counters.methods.server1.GET, counters.methods.server2.GET], backgroundColor: "rgba(255, 159, 64, 0.5)" }
            ]
        };

        // Gráfico diario (necesita procesamiento adicional para fechas)
        const allDates = [...new Set([
            ...Object.keys(counters.daily.server1), 
            ...Object.keys(counters.daily.server2)
        ])].sort();
        
        const dailyChart = {
            labels: allDates,
            datasets: [
                { 
                    label: "Servidor 1", 
                    data: allDates.map(date => counters.daily.server1[date] || 0), 
                    backgroundColor: "rgba(54, 162, 235, 0.5)" 
                },
                { 
                    label: "Servidor 2", 
                    data: allDates.map(date => counters.daily.server2[date] || 0), 
                    backgroundColor: "rgba(255, 159, 64, 0.5)" 
                }
            ]
        };

        return {
            chartData: statusChart,
            responseTimeData: timeChart,
            methodChartData: methodChart,
            dailyChartData: dailyChart
        };
    }, [logs]);

    const fetchLogs = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/getServer`);
            if (response.data?.logs) {
                setLogs(response.data.logs);
            } else {
                setError("Formato de datos inesperado");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Error obteniendo logs. Por favor intente nuevamente.");
            console.error("Error obteniendo logs:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <div className="container mt-4">
            <h2 className="text-center mb-4">Dashboard de Monitoreo</h2>
            
            {error && (
                <div className="alert alert-danger">
                    {error} 
                    <button className="btn btn-sm btn-outline-danger ms-3" onClick={fetchLogs}>
                        Reintentar
                    </button>
                </div>
            )}

            {isLoading ? (
                <div className="text-center my-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                    <p className="mt-2">Cargando datos de logs...</p>
                </div>
            ) : (
                <>
                    <div className="row">
                        <div className="col-md-6">
                            <div className="card mb-4">
                                <div className="card-header bg-primary text-white">
                                    <h5 className="card-title mb-0">Estados de Respuesta</h5>
                                </div>
                                <div className="card-body">
                                    {chartData ? (
                                        <Bar data={chartData} options={chartOptions} />
                                    ) : (
                                        <p className="text-muted">No hay datos disponibles</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="col-md-6">
                            <div className="card mb-4">
                                <div className="card-header bg-info text-white">
                                    <h5 className="card-title mb-0">Tiempos de Respuesta</h5>
                                </div>
                                <div className="card-body">
                                    {responseTimeData ? (
                                        <Bar data={responseTimeData} options={chartOptions} />
                                    ) : (
                                        <p className="text-muted">No hay datos disponibles</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6">
                            <div className="card mb-4">
                                <div className="card-header bg-success text-white">
                                    <h5 className="card-title mb-0">Actividad por Fecha</h5>
                                </div>
                                <div className="card-body">
                                    {dailyChartData ? (
                                        <Bar 
                                            data={dailyChartData} 
                                            options={{
                                                ...chartOptions,
                                                scales: {
                                                    y: {
                                                        beginAtZero: true,
                                                        title: { display: true, text: 'Logs por día' }
                                                    }
                                                }
                                            }} 
                                        />
                                    ) : (
                                        <p className="text-muted">No hay datos disponibles</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="col-md-6">
                            <div className="card mb-4">
                                <div className="card-header bg-warning text-dark">
                                    <h5 className="card-title mb-0">Métodos HTTP</h5>
                                </div>
                                <div className="card-body">
                                    {methodChartData ? (
                                        <Bar data={methodChartData} options={chartOptions} />
                                    ) : (
                                        <p className="text-muted">No hay datos disponibles</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <div className="text-center my-4">
                <button 
                    className="btn btn-primary me-2"
                    onClick={fetchLogs}
                    disabled={isLoading}
                >
                    {isLoading ? 'Actualizando...' : 'Actualizar Datos'}
                </button>
                <button 
                    className="btn btn-secondary"
                    onClick={() => navigate('/home')}
                >
                    Volver al Inicio
                </button>
            </div>
        </div>
    );
};

export default Logs;