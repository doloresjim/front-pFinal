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


console.log(logs);
useEffect(() => {
    fetchLogs();
}, []);

    console.log(logs);

    const procesarDatos = (logs) => {
        let cantidadServidor1_info = 0;
        let cantidadServidor1_warn = 0;
        let cantidadServidor1_error = 0;

        let cantidadServidor2_info = 0;
        let cantidadServidor2_warn = 0;
        let cantidadServidor2_error = 0;

        logs.forEach(log => {
            if (log.server === 1) {
                if ([200, 201, 204].includes(log.status)) cantidadServidor1_info++;
                else if ([300, 301, 302].includes(log.status)) cantidadServidor1_warn++;
                else if (log.status >= 400) cantidadServidor1_error++;
            }
            if (log.server === 2) {
                if ([200, 201, 204].includes(log.status)) cantidadServidor2_info++;
                else if ([300, 301, 302].includes(log.status)) cantidadServidor2_warn++;
                else if (log.status >= 400) cantidadServidor2_error++;
            }
        });

        const labels = ["Servidor 1", "Servidor 2"];
        const valoresInfo = [cantidadServidor1_info, cantidadServidor2_info];
        const valoresWarn = [cantidadServidor1_warn, cantidadServidor2_warn];
        const valoresError = [cantidadServidor1_error, cantidadServidor2_error];

        setChartData({
            labels,
            datasets: [
                { label: "Info", data: valoresInfo, backgroundColor: "rgba(54, 162, 235, 0.5)", borderColor: "rgba(54, 162, 235, 1)", borderWidth: 1 },
                { label: "Warn", data: valoresWarn, backgroundColor: "rgba(255, 159, 64, 0.5)", borderColor: "rgba(255, 159, 64, 1)", borderWidth: 1 },
                { label: "Error", data: valoresError, backgroundColor: "rgba(255, 99, 132, 0.5)", borderColor: "rgba(255, 99, 132, 1)", borderWidth: 1 }
            ]
        });
    };

    const procesarTiemposRespuesta = (logs) => {
        let servidor1_fast = 0;
        let servidor1_medium = 0;
        let servidor1_slow = 0;

        let servidor2_fast = 0;
        let servidor2_medium = 0;
        let servidor2_slow = 0;

        logs.forEach(log => {
            if (log.server === 1) {
                if (log.responseTime < 200) servidor1_fast++;
                else if (log.responseTime >= 200 && log.responseTime <= 500) servidor1_medium++;
                else servidor1_slow++;
            }
            if (log.server === 2) {
                if (log.responseTime < 200) servidor2_fast++;
                else if (log.responseTime >= 200 && log.responseTime <= 500) servidor2_medium++;
                else servidor2_slow++;
            }
        });

        const labels = ["Servidor 1", "Servidor 2"];
        const fastData = [servidor1_fast, servidor2_fast];
        const mediumData = [servidor1_medium, servidor2_medium];
        const slowData = [servidor1_slow, servidor2_slow];

        setResponseTimeData({
            labels,
            datasets: [
                { label: "Rápido (<200ms)", data: fastData, backgroundColor: "rgba(75, 192, 192, 0.5)", borderColor: "rgba(75, 192, 192, 1)", borderWidth: 1 },
                { label: "Medio (200-500ms)", data: mediumData, backgroundColor: "rgba(255, 205, 86, 0.5)", borderColor: "rgba(255, 205, 86, 1)", borderWidth: 1 },
                { label: "Lento (>500ms)", data: slowData, backgroundColor: "rgba(255, 99, 132, 0.5)", borderColor: "rgba(255, 99, 132, 1)", borderWidth: 1 }
            ]
        });
    };

    const procesarDatosPorFecha = (logs) => {
        const server1Days = {};
        const server2Days = {};

        logs.forEach(log => {
            if (log.timestamp && log.timestamp._seconds && log.timestamp._nanoseconds) {
                const date = new Date(log.timestamp._seconds * 1000 + log.timestamp._nanoseconds / 1000000);
                const dateString = date.toISOString().split('T')[0];

                if (log.server === 1) {
                    server1Days[dateString] = (server1Days[dateString] || 0) + 1;
                } else if (log.server === 2) {
                    server2Days[dateString] = (server2Days[dateString] || 0) + 1;
                }
            } else {
                console.warn("Registro con timestamp inválido:", log);
            }
        });

        const allDates = [...new Set([...Object.keys(server1Days), ...Object.keys(server2Days)])].sort();
        const valoresServidor1 = allDates.map(date => server1Days[date] || 0);
        const valoresServidor2 = allDates.map(date => server2Days[date] || 0);

        setDailyChartData({ // Actualiza el estado correcto
            labels: allDates,
            datasets: [
                { label: "Servidor 1", data: valoresServidor1, backgroundColor: "rgba(54, 162, 235, 0.5)", borderColor: "rgba(54, 162, 235, 1)", borderWidth: 1 },
                { label: "Servidor 2", data: valoresServidor2, backgroundColor: "rgba(255, 159, 64, 0.5)", borderColor: "rgba(255, 159, 64, 1)", borderWidth: 1 }
            ]
        });
    };

    const procesarDatosPorMethod = (logs) => { // Cambiar setChartData a setMethodChartData para evitar conflictos
        let cantidadServidor1_POST = 0;
        let cantidadServidor1_GET = 0;
    
        let cantidadServidor2_POST = 0;
        let cantidadServidor2_GET = 0;
    
        logs.forEach(log => {
            if (log.server === 1) {
                if (log.method === 'POST') cantidadServidor1_POST++;
                else if (log.method === 'GET') cantidadServidor1_GET++;
            }
            if (log.server === 2) {
                if (log.method === 'POST') cantidadServidor2_POST++;
                else if (log.method === 'GET') cantidadServidor2_GET++;
            }
        });
    
        const labels = ["Servidor 1", "Servidor 2"];
        const valoresPOST = [cantidadServidor1_POST, cantidadServidor2_POST];
        const valoresGET = [cantidadServidor1_GET, cantidadServidor2_GET];
    
        setMethodChartData({ // Usar setMethodChartData para actualizar el estado correcto
            labels,
            datasets: [
                { label: "POST", data: valoresPOST, backgroundColor: "rgba(54, 162, 235, 0.5)", borderColor: "rgba(54, 162, 235, 1)", borderWidth: 1 },
                { label: "GET", data: valoresGET, backgroundColor: "rgba(255, 159, 64, 0.5)", borderColor: "rgba(255, 159, 64, 1)", borderWidth: 1 }
            ]
        });
    };

    console.log('Server1');

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