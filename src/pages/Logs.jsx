import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Logs = () => {
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [chartData, setChartData] = useState(null);
    const [responseTimeData, setResponseTimeData] = useState(null);
    const [dailyChartData, setDailyChartData] = useState(null);
    const [methodChartData, setMethodChartData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Función para obtener y procesar los logs
    const fetchLogs = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/getServer`);
            
            if (!response.data?.logs) {
                throw new Error("Formato de respuesta inesperado");
            }

            const validLogs = response.data.logs.filter(log => 
                log && typeof log.server === 'number' && log.timestamp
            );

            if (validLogs.length === 0) {
                setError("No hay logs válidos disponibles");
                return;
            }

            setLogs(validLogs);
            procesarDatos(validLogs);
            procesarTiemposRespuesta(validLogs);
            procesarDatosPorFecha(validLogs);
            procesarDatosPorMethod(validLogs);
            
        } catch (err) {
            console.error("Error obteniendo logs:", err);
            setError(`Error al cargar logs: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Procesar datos para la gráfica principal
    const procesarDatos = (logs) => {
        const counts = {
            server1: { info: 0, warn: 0, error: 0 },
            server2: { info: 0, warn: 0, error: 0 }
        };

        logs.forEach(log => {
            if (log.server === 1) {
                if ([200, 201, 204].includes(log.status)) counts.server1.info++;
                else if ([300, 301, 302].includes(log.status)) counts.server1.warn++;
                else if (log.status >= 400) counts.server1.error++;
            } else if (log.server === 2) {
                if ([200, 201, 204].includes(log.status)) counts.server2.info++;
                else if ([300, 301, 302].includes(log.status)) counts.server2.warn++;
                else if (log.status >= 400) counts.server2.error++;
            }
        });

        setChartData({
            labels: ["Servidor 1", "Servidor 2"],
            datasets: [
                { 
                    label: "Info", 
                    data: [counts.server1.info, counts.server2.info], 
                    backgroundColor: "rgba(54, 162, 235, 0.7)" 
                },
                { 
                    label: "Warn", 
                    data: [counts.server1.warn, counts.server2.warn], 
                    backgroundColor: "rgba(255, 159, 64, 0.7)" 
                },
                { 
                    label: "Error", 
                    data: [counts.server1.error, counts.server2.error], 
                    backgroundColor: "rgba(255, 99, 132, 0.7)" 
                }
            ]
        });
    };

    // Procesar tiempos de respuesta
    const procesarTiemposRespuesta = (logs) => {
        const times = {
            server1: { fast: 0, medium: 0, slow: 0 },
            server2: { fast: 0, medium: 0, slow: 0 }
        };

        logs.forEach(log => {
            if (typeof log.responseTime !== 'number') return;
            
            if (log.server === 1) {
                if (log.responseTime < 200) times.server1.fast++;
                else if (log.responseTime <= 500) times.server1.medium++;
                else times.server1.slow++;
            } else if (log.server === 2) {
                if (log.responseTime < 200) times.server2.fast++;
                else if (log.responseTime <= 500) times.server2.medium++;
                else times.server2.slow++;
            }
        });

        setResponseTimeData({
            labels: ["Servidor 1", "Servidor 2"],
            datasets: [
                { 
                    label: "Rápido (<200ms)", 
                    data: [times.server1.fast, times.server2.fast], 
                    backgroundColor: "rgba(75, 192, 192, 0.7)" 
                },
                { 
                    label: "Medio (200-500ms)", 
                    data: [times.server1.medium, times.server2.medium], 
                    backgroundColor: "rgba(255, 205, 86, 0.7)" 
                },
                { 
                    label: "Lento (>500ms)", 
                    data: [times.server1.slow, times.server2.slow], 
                    backgroundColor: "rgba(255, 99, 132, 0.7)" 
                }
            ]
        });
    };

    // Procesar datos por fecha (corregido)
    const procesarDatosPorFecha = (logs) => {
        const serverData = {
            server1: {},
            server2: {}
        };

        logs.forEach(log => {
            if (!log.timestamp) return;

            try {
                let date;
            
                // Manejar diferentes formatos de timestamp
                if (log.timestamp?._seconds) {
                    date = new Date(log.timestamp._seconds * 1000);
                } else if (typeof log.timestamp === 'string') {
                    date = new Date(log.timestamp);
                } else if (log.timestamp instanceof Date) {
                    date = log.timestamp;
                } else {
                    return;
                }
            
                // Validar que la fecha sea válida
                if (isNaN(date.getTime())) return;
            
                // Obtener la fecha local en formato YYYY-MM-DD
                const dateString = date.toLocaleDateString('sv-SE'); // Formato ISO sin hora (ej: "2025-04-13")
            
                if (log.server === 1) {
                    serverData.server1[dateString] = (serverData.server1[dateString] || 0) + 1;
                } else if (log.server === 2) {
                    serverData.server2[dateString] = (serverData.server2[dateString] || 0) + 1;
                }
            } catch (error) {
                console.error("Error procesando log:", error);
            }
            
        });

        const allDates = [...new Set([
            ...Object.keys(serverData.server1),
            ...Object.keys(serverData.server2)
        ])].sort();

        setDailyChartData({
            labels: allDates,
            datasets: [
                { 
                    label: "Servidor 1", 
                    data: allDates.map(date => serverData.server1[date] || 0), 
                    backgroundColor: "rgba(54, 162, 235, 0.7)" 
                },
                { 
                    label: "Servidor 2", 
                    data: allDates.map(date => serverData.server2[date] || 0), 
                    backgroundColor: "rgba(255, 159, 64, 0.7)" 
                }
            ]
        });
    };

    // Procesar datos por método HTTP
    const procesarDatosPorMethod = (logs) => {
        const methods = {
            server1: { GET: 0, POST: 0, PUT: 0, DELETE: 0, OTHER: 0 },
            server2: { GET: 0, POST: 0, PUT: 0, DELETE: 0, OTHER: 0 }
        };

        logs.forEach(log => {
            if (!log.method) return;

            const method = (log.method.toUpperCase() in methods.server1) 
                ? log.method.toUpperCase() 
                : 'OTHER';

            if (log.server === 1) {
                methods.server1[method]++;
            } else if (log.server === 2) {
                methods.server2[method]++;
            }
        });

        const methodLabels = Object.keys(methods.server1).filter(
            method => methods.server1[method] > 0 || methods.server2[method] > 0
        );

        setMethodChartData({
            labels: ["Servidor 1", "Servidor 2"],
            datasets: methodLabels.map((method, i) => {
                const colors = [
                    "rgba(54, 162, 235, 0.7)",
                    "rgba(255, 159, 64, 0.7)",
                    "rgba(153, 102, 255, 0.7)",
                    "rgba(255, 99, 132, 0.7)",
                    "rgba(75, 192, 192, 0.7)"
                ];
                return {
                    label: method,
                    data: [methods.server1[method], methods.server2[method]],
                    backgroundColor: colors[i % colors.length]
                };
            })
        });
    };

    // Cargar datos iniciales al montar el componente
    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <div className="container mt-4">
            <h2 className="text-center mb-4">Monitor de Logs</h2>
            
            {error && (
                <div className="alert alert-danger alert-dismissible fade show">
                    {error}
                    <button 
                        type="button" 
                        className="btn-close" 
                        onClick={() => setError(null)}
                    />
                </div>
            )}

            <div className="d-flex justify-content-between mb-4">
                <button 
                    className="btn btn-primary"
                    onClick={fetchLogs}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Cargando...
                        </>
                    ) : 'Actualizar Datos'}
                </button>
                
                <button 
                    className="btn btn-secondary"
                    onClick={() => navigate('/home')}
                >
                    Volver al Home
                </button>
            </div>

            {loading && !chartData ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}}>
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                    <p className="mt-3">Cargando datos de logs...</p>
                </div>
            ) : (
                <>
                    <div className="row mb-4">
                        <div className="col-md-6">
                            <div className="card h-100">
                                <div className="card-header bg-primary text-white">
                                    <h5>Distribución por Tipo</h5>
                                </div>
                                <div className="card-body">
                                    {chartData ? (
                                        <Bar 
                                            data={chartData}
                                            options={{ responsive: true }}
                                        />
                                    ) : (
                                        <p className="text-muted">No hay datos disponibles</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="col-md-6">
                            <div className="card h-100">
                                <div className="card-header bg-success text-white">
                                    <h5>Tiempos de Respuesta</h5>
                                </div>
                                <div className="card-body">
                                    {responseTimeData ? (
                                        <Bar 
                                            data={responseTimeData}
                                            options={{ responsive: true }}
                                        />
                                    ) : (
                                        <p className="text-muted">No hay datos disponibles</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row mb-4">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header bg-info text-white">
                                    <h5>Actividad por Fecha</h5>
                                </div>
                                <div className="card-body">
                                    {dailyChartData ? (
                                        <Bar 
                                            data={dailyChartData}
                                            options={{ 
                                                responsive: true,
                                                scales: {
                                                    x: { title: { display: true, text: 'Fecha' } },
                                                    y: { title: { display: true, text: 'Número de Logs' } }
                                                }
                                            }}
                                        />
                                    ) : (
                                        <p className="text-muted">No hay datos disponibles</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header bg-warning text-dark">
                                    <h5>Métodos HTTP</h5>
                                </div>
                                <div className="card-body">
                                    {methodChartData ? (
                                        <Bar 
                                            data={methodChartData}
                                            options={{ responsive: true }}
                                        />
                                    ) : (
                                        <p className="text-muted">No hay datos disponibles</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Logs;