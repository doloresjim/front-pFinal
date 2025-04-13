import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Logs = () => {
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [chartData, setChartData] = useState(null);
    const [responseTimeData, setResponseTimeData] = useState(null);
    const [dailyChartData, setDailyChartData] = useState(null);
    const [methodChartData, setMethodChartData] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Opciones comunes para los gráficos
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

    const fetchLogs = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/getServer`);
            if (response.data.logs && response.data.logs.length > 0) {
                setLogs(response.data.logs);
                procesarDatos(response.data.logs);
                procesarTiemposRespuesta(response.data.logs);
                procesarDatosPorFecha(response.data.logs);
                procesarDatosPorMethod(response.data.logs);
            }
        } catch (err) {
            setError("Error obteniendo logs. Por favor intente nuevamente.");
            console.error("Error obteniendo logs: ", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const procesarDatos = (logs) => {
        // ... (mantener la misma implementación)
    };

    const procesarTiemposRespuesta = (logs) => {
        // ... (mantener la misma implementación)
    };

    const procesarDatosPorFecha = (logs) => {
        // ... (mantener la misma implementación)
    };

    const procesarDatosPorMethod = (logs) => {
        // ... (mantener la misma implementación)
    };

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
                        {/* Gráfico de Estados de Respuesta */}
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
                        
                        {/* Gráfico de Tiempos de Respuesta */}
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
                        {/* Gráfico de Actividad por Fecha */}
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
                        
                        {/* Gráfico de Métodos HTTP */}
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