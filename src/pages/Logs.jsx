import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Registrar componentes necesarios de Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Logs = () => {
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [chartData, setChartData] = useState(null);
    const [responseTimeData, setResponseTimeData] = useState(null);
    const [dailyChartData, setDailyChartData] = useState(null);
    const [methodChartData, setMethodChartData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Función para obtener los logs del servidor
    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/getServer`);
            
            if (response.data && response.data.logs) {
                if (response.data.logs.length > 0) {
                    setLogs(response.data.logs);
                    procesarDatos(response.data.logs);
                    procesarTiemposRespuesta(response.data.logs);
                    procesarDatosPorFecha(response.data.logs);
                    procesarDatosPorMethod(response.data.logs);
                    setError(null);
                } else {
                    setError("No hay registros de logs disponibles.");
                }
            } else {
                setError("Formato de respuesta inesperado del servidor.");
            }
        } catch (err) {
            console.error("Error obteniendo logs:", err);
            setError(`Error al cargar los logs: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Procesar datos para la gráfica principal (info, warn, error)
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
                    backgroundColor: "rgba(54, 162, 235, 0.7)", 
                    borderColor: "rgba(54, 162, 235, 1)", 
                    borderWidth: 1 
                },
                { 
                    label: "Warn", 
                    data: [counts.server1.warn, counts.server2.warn], 
                    backgroundColor: "rgba(255, 159, 64, 0.7)", 
                    borderColor: "rgba(255, 159, 64, 1)", 
                    borderWidth: 1 
                },
                { 
                    label: "Error", 
                    data: [counts.server1.error, counts.server2.error], 
                    backgroundColor: "rgba(255, 99, 132, 0.7)", 
                    borderColor: "rgba(255, 99, 132, 1)", 
                    borderWidth: 1 
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
                    backgroundColor: "rgba(75, 192, 192, 0.7)", 
                    borderColor: "rgba(75, 192, 192, 1)", 
                    borderWidth: 1 
                },
                { 
                    label: "Medio (200-500ms)", 
                    data: [times.server1.medium, times.server2.medium], 
                    backgroundColor: "rgba(255, 205, 86, 0.7)", 
                    borderColor: "rgba(255, 205, 86, 1)", 
                    borderWidth: 1 
                },
                { 
                    label: "Lento (>500ms)", 
                    data: [times.server1.slow, times.server2.slow], 
                    backgroundColor: "rgba(255, 99, 132, 0.7)", 
                    borderColor: "rgba(255, 99, 132, 1)", 
                    borderWidth: 1 
                }
            ]
        });
    };

    // Procesar datos por fecha
    const procesarDatosPorFecha = (logs) => {
        const serverData = {
            server1: {},
            server2: {}
        };

        logs.forEach(log => {
            if (!log.timestamp) return;

            try {
                let date;
                if (log.timestamp._seconds) {
                    date = new Date(log.timestamp._seconds * 1000);
                } else if (typeof log.timestamp === 'string') {
                    date = new Date(log.timestamp);
                } else {
                    return;
                }

                const dateString = date.toISOString().split('T')[0];

                if (log.server === 1) {
                    serverData.server1[dateString] = (serverData.server1[dateString] || 0) + 1;
                } else if (log.server === 2) {
                    serverData.server2[dateString] = (serverData.server2[dateString] || 0) + 1;
                }
            } catch (e) {
                console.warn("Error procesando fecha:", e);
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
                    backgroundColor: "rgba(54, 162, 235, 0.7)", 
                    borderColor: "rgba(54, 162, 235, 1)", 
                    borderWidth: 1 
                },
                { 
                    label: "Servidor 2", 
                    data: allDates.map(date => serverData.server2[date] || 0), 
                    backgroundColor: "rgba(255, 159, 64, 0.7)", 
                    borderColor: "rgba(255, 159, 64, 1)", 
                    borderWidth: 1 
                }
            ]
        });
    };

    // Procesar datos por método HTTP
    const procesarDatosPorMethod = (logs) => {
        const methods = {
            server1: { GET: 0, POST: 0, PUT: 0, DELETE: 0 },
            server2: { GET: 0, POST: 0, PUT: 0, DELETE: 0 }
        };

        logs.forEach(log => {
            if (!log.method) return;

            const method = log.method.toUpperCase();
            if (log.server === 1) {
                methods.server1[method] = (methods.server1[method] || 0) + 1;
            } else if (log.server === 2) {
                methods.server2[method] = (methods.server2[method] || 0) + 1;
            }
        });

        setMethodChartData({
            labels: ["Servidor 1", "Servidor 2"],
            datasets: Object.keys(methods.server1)
                .filter(method => methods.server1[method] > 0 || methods.server2[method] > 0)
                .map((method, index) => {
                    const colors = [
                        "rgba(54, 162, 235, 0.7)",
                        "rgba(255, 159, 64, 0.7)",
                        "rgba(153, 102, 255, 0.7)",
                        "rgba(255, 99, 132, 0.7)"
                    ];
                    return {
                        label: method,
                        data: [methods.server1[method], methods.server2[method]],
                        backgroundColor: colors[index % colors.length],
                        borderColor: colors[index % colors.length].replace('0.7', '1'),
                        borderWidth: 1
                    };
                })
        });
    };

    // Efecto para cargar datos iniciales y configurar actualización periódica
    useEffect(() => {
        fetchLogs();
        
        const intervalId = setInterval(fetchLogs, 30000); // Actualizar cada 30 segundos
        
        return () => {
            clearInterval(intervalId); // Limpieza al desmontar el componente
        };
    }, []);

    return (
        <div className="container mt-4">
            <h1 className="text-center mb-4">Panel de Monitoreo de Logs</h1>
            
            {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    {error}
                    <button 
                        type="button" 
                        className="btn-close" 
                        onClick={() => setError(null)}
                        aria-label="Close"
                    ></button>
                </div>
            )}

            {loading ? (
                <div className="text-center my-5">
                    <div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}} role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                    <p className="mt-3">Cargando datos de logs...</p>
                </div>
            ) : (
                <>
                    <div className="row">
                        <div className="col-md-6 mb-4">
                            <div className="card h-100">
                                <div className="card-header bg-primary text-white">
                                    <h5 className="card-title mb-0">Distribución por Tipo de Respuesta</h5>
                                </div>
                                <div className="card-body">
                                    {chartData ? (
                                        <Bar 
                                            data={chartData} 
                                            options={{ 
                                                responsive: true, 
                                                plugins: { 
                                                    legend: { position: 'top' },
                                                    tooltip: { mode: 'index', intersect: false }
                                                },
                                                scales: {
                                                    y: { beginAtZero: true }
                                                }
                                            }} 
                                        />
                                    ) : (
                                        <p className="text-muted">No hay datos disponibles</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="col-md-6 mb-4">
                            <div className="card h-100">
                                <div className="card-header bg-success text-white">
                                    <h5 className="card-title mb-0">Tiempos de Respuesta</h5>
                                </div>
                                <div className="card-body">
                                    {responseTimeData ? (
                                        <Bar 
                                            data={responseTimeData} 
                                            options={{ 
                                                responsive: true, 
                                                plugins: { 
                                                    legend: { position: 'top' },
                                                    tooltip: { mode: 'index', intersect: false }
                                                },
                                                scales: {
                                                    y: { beginAtZero: true }
                                                }
                                            }} 
                                        />
                                    ) : (
                                        <p className="text-muted">No hay datos disponibles</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="col-12 mb-4">
                            <div className="card">
                                <div className="card-header bg-info text-white">
                                    <h5 className="card-title mb-0">Actividad por Fecha</h5>
                                </div>
                                <div className="card-body">
                                    {dailyChartData ? (
                                        <Bar 
                                            data={dailyChartData} 
                                            options={{ 
                                                responsive: true, 
                                                plugins: { 
                                                    legend: { position: 'top' },
                                                    tooltip: { mode: 'index', intersect: false }
                                                },
                                                scales: {
                                                    x: { title: { display: true, text: 'Fecha' } },
                                                    y: { 
                                                        beginAtZero: true,
                                                        title: { display: true, text: 'Número de Logs' }
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

                        <div className="col-12 mb-4">
                            <div className="card">
                                <div className="card-header bg-warning text-dark">
                                    <h5 className="card-title mb-0">Distribución por Método HTTP</h5>
                                </div>
                                <div className="card-body">
                                    {methodChartData ? (
                                        <Bar 
                                            data={methodChartData} 
                                            options={{ 
                                                responsive: true, 
                                                plugins: { 
                                                    legend: { position: 'top' },
                                                    tooltip: { mode: 'index', intersect: false }
                                                },
                                                scales: {
                                                    y: { beginAtZero: true }
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

                    <div className="d-flex justify-content-between mb-5">
                        <button 
                            className="btn btn-primary"
                            onClick={fetchLogs}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Actualizando...
                                </>
                            ) : (
                                'Actualizar Datos'
                            )}
                        </button>
                        
                        <button 
                            className="btn btn-secondary"
                            onClick={() => navigate('/home')}
                        >
                            Volver al Home
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default Logs;