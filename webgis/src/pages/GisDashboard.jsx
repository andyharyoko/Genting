import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

export default function GisDashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState({ user: {}, summary: {}, actionable_clusters: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                const response = await axios.get('/api/v1/dashboard/gis', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(response.data.data);
            } catch (error) {
                console.error('Error fetching gis data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        navigate('/');
    };

    return (



<div className="bg-background text-on-background font-body-md antialiased pb-24 relative overflow-x-hidden min-h-screen">

<nav className="hidden md:flex bg-surface-container dark:bg-inverse-surface h-screen w-[260px] border-r border-outline-variant dark:border-outline fixed left-0 top-0 bottom-0 flex-col z-50">

<div className="px-6 py-8">
<div className="flex items-center gap-3 mb-2">
<div className="w-8 h-8 rounded bg-secondary flex items-center justify-center text-on-secondary font-bold font-headline-md text-headline-md">
                    G
                </div>
<div>
<h1 className="font-headline-md text-headline-md font-black text-primary dark:text-primary-fixed">GENTING Dashboard</h1>
<p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest mt-1">Analytics &amp; GIS</p>
</div>
</div>
</div>

<div className="flex flex-col gap-2 mt-4 flex-grow">

<a className="flex items-center gap-3 px-4 py-3 cursor-pointer bg-primary-container dark:bg-on-primary-fixed-variant text-on-primary-container dark:text-primary-fixed rounded-full mx-2 transition-all" href="#">
<span className="material-symbols-outlined" data-icon="map" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
<span className="font-data-mono text-data-mono">Spatial Map</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 cursor-pointer text-on-surface-variant dark:text-surface-variant mx-2 rounded-full hover:bg-surface-container-highest dark:hover:bg-surface-variant transition-all" href="#">
<span className="material-symbols-outlined" data-icon="analytics">analytics</span>
<span className="font-data-mono text-data-mono">Stunting Statistics</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 cursor-pointer text-on-surface-variant dark:text-surface-variant mx-2 rounded-full hover:bg-surface-container-highest dark:hover:bg-surface-variant transition-all" href="#">
<span className="material-symbols-outlined" data-icon="inventory_2">inventory_2</span>
<span className="font-data-mono text-data-mono">Resource Allocation</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 cursor-pointer text-on-surface-variant dark:text-surface-variant mx-2 rounded-full hover:bg-surface-container-highest dark:hover:bg-surface-variant transition-all mt-auto mb-6" href="#">
<span className="material-symbols-outlined" data-icon="settings">settings</span>
<span className="font-data-mono text-data-mono">Settings</span>
</a>
</div>
</nav>

<main className="flex-1 flex flex-col md:ml-[260px] h-screen relative">

<header className="bg-surface dark:bg-inverse-surface w-full border-b border-outline-variant dark:border-outline flat no shadows flex justify-between items-center px-gutter h-16 sticky top-0 z-40">

<button className="md:hidden p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors">
<span className="material-symbols-outlined">menu</span>
</button>
<div className="md:hidden font-headline-md text-headline-md font-bold text-primary">
                GENTING GIS
            </div>

<div className="hidden md:flex flex-1 justify-end mr-6">
<div className="relative w-64">
<span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-on-surface-variant text-sm">search</span>
<input />
</div>
</div>

<div className="flex items-center gap-2">
<button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors cursor-pointer active:opacity-80">
<span className="material-symbols-outlined" data-icon="notifications">notifications</span>
</button>
<button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors cursor-pointer active:opacity-80 mr-2">
<span className="material-symbols-outlined" data-icon="help">help</span>
</button>
<div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold mr-2 cursor-pointer">
A
</div>
<button onClick={handleLogout} className="p-2 text-primary hover:bg-surface-container rounded-full transition-colors cursor-pointer">
<span className="material-symbols-outlined">logout</span>
</button>
</div>
</header>

<div className="flex-1 relative w-full h-full map-bg overflow-hidden">

<MapContainer center={[-6.9, 112.05]} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false}>
    <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
    />
    
    {!loading && data.actionable_clusters.map((cluster) => (
        <Circle 
            key={cluster.id}
            center={cluster.coords}
            pathOptions={{ 
                color: cluster.status === 'CRITICAL' ? '#ba1a1a' : '#fcdeb5', 
                fillColor: cluster.status === 'CRITICAL' ? '#ba1a1a' : '#fcdeb5', 
                fillOpacity: 0.2 
            }}
            radius={2000}
        >
            <Popup>
                <b>{cluster.nama}</b><br/>
                {cluster.cases} cases ({cluster.status})
            </Popup>
        </Circle>
    ))}
</MapContainer>

<div className="absolute top-container-padding left-container-padding right-[350px] z-20">
<div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-3 shadow-sm flex flex-wrap gap-4 items-center">
<div className="flex items-center gap-2 text-on-surface-variant">
<span className="material-symbols-outlined text-sm">filter_list</span>
<span className="font-data-mono text-data-mono font-semibold">Filters</span>
</div>
<div className="h-6 w-px bg-outline-variant hidden sm:block"></div>
<div className="flex-1 flex gap-4 min-w-[200px]">
<select className="flex-1 bg-surface-container-low border border-outline-variant rounded-md text-data-mono font-data-mono text-on-surface py-1.5 px-3 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-colors">
<option>Kabupaten: Semua</option>
<option>Kabupaten A</option>
<option>Kabupaten B</option>
</select>
<select className="flex-1 bg-surface-container-low border border-outline-variant rounded-md text-data-mono font-data-mono text-on-surface py-1.5 px-3 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-colors">
<option>Kecamatan: Pilih...</option>
</select>
<select className="flex-1 bg-surface-container-low border border-outline-variant rounded-md text-data-mono font-data-mono text-on-surface py-1.5 px-3 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-colors">
<option>Desa: Pilih...</option>
</select>
</div>
</div>
</div>

<div className="absolute top-container-padding right-container-padding bottom-container-padding w-[320px] bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.05)] flex flex-col z-30 overflow-hidden">
<div className="p-5 border-b border-outline-variant bg-surface-bright">
<h2 className="font-title-sm text-title-sm text-primary mb-1">Hotspot Intelligence</h2>
<p className="font-body-md text-body-md text-on-surface-variant text-xs">Real-time risk assessment</p>
</div>
<div className="p-5 overflow-y-auto flex-1">

<div className="grid grid-cols-2 gap-3 mb-6">
<div className="bg-error-container/20 border border-error-container rounded-lg p-3">
<div className="font-label-caps text-label-caps text-error mb-1">Critical</div>
<div className="font-display-lg-mobile text-display-lg-mobile text-error">{data.summary.active_hotspots || 0}</div>
<div className="text-xs text-on-surface-variant mt-1">Hotspots active</div>
</div>
<div className="bg-secondary-fixed/20 border border-secondary-fixed rounded-lg p-3">
<div className="font-label-caps text-label-caps text-secondary mb-1">Coverage</div>
<div className="font-display-lg-mobile text-display-lg-mobile text-secondary">{data.summary.intervention_rate || 0}%</div>
<div className="text-xs text-on-surface-variant mt-1">Intervention rate</div>
</div>
</div>
<h3 className="font-data-mono text-data-mono font-semibold text-on-surface mb-3 uppercase tracking-wider text-xs">Actionable Clusters</h3>

<div className="flex flex-col gap-3">
{loading ? (
    <div className="text-sm text-center text-on-surface-variant">Memuat data...</div>
) : (
    data.actionable_clusters.map((cluster) => (
        <div key={cluster.id} className="p-3 border border-outline-variant rounded-lg hover:border-secondary transition-colors cursor-pointer bg-surface-bright">
            <div className="flex justify-between items-start mb-2">
            <div>
            <h4 className="font-data-mono text-data-mono font-semibold text-on-surface">{cluster.nama}</h4>
            <p className="text-xs text-on-surface-variant">{cluster.kecamatan}</p>
            </div>
            <span className={cluster.status === 'CRITICAL' ? "bg-error/10 text-error px-2 py-0.5 rounded-full text-[10px] font-bold border border-error/20" : "bg-tertiary-fixed/30 text-on-tertiary-fixed px-2 py-0.5 rounded-full text-[10px] font-bold border border-tertiary-fixed/50"}>
                {cluster.status}
            </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-2">
            <span className="material-symbols-outlined text-[14px]">
                {cluster.status === 'CRITICAL' ? 'warning' : 'info'}
            </span>
            <span>{cluster.cases} cases within 2km</span>
            </div>
        </div>
    ))
)}
</div>
</div>
</div>

<div className="absolute bottom-container-padding left-container-padding flex gap-4 z-20">
<div className="bg-surface-container-lowest/90 backdrop-blur-sm border border-outline-variant rounded-lg p-4 shadow-sm flex items-center gap-4 min-w-[200px]">
<div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
<span className="material-symbols-outlined">child_care</span>
</div>
<div>
<div className="text-xs text-on-surface-variant font-label-caps uppercase tracking-wider mb-0.5">Balita Monitored</div>
<div className="font-title-sm text-title-sm text-primary">{data.summary.total_balita || 0}</div>
</div>
</div>
<div className="bg-surface-container-lowest/90 backdrop-blur-sm border border-outline-variant rounded-lg p-4 shadow-sm flex items-center gap-4 min-w-[200px]">
<div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
<span className="material-symbols-outlined">local_shipping</span>
</div>
<div>
<div className="text-xs text-on-surface-variant font-label-caps uppercase tracking-wider mb-0.5">MBG Efficiency</div>
<div className="font-title-sm text-title-sm text-primary">{data.summary.mbg_efficiency || 0}%</div>
</div>
</div>
</div>

<div className="absolute bottom-container-padding right-[360px] bg-surface-container-lowest/80 backdrop-blur-md border border-outline-variant rounded-lg p-3 z-20 text-xs shadow-sm">
<div className="font-label-caps text-label-caps mb-2 text-on-surface-variant">Risk Level (2km Buffer)</div>
<div className="flex flex-col gap-2">
<div className="flex items-center gap-2">
<div className="w-3 h-3 rounded-full bg-error border border-error/20"></div>
<span>Critical (&gt;10 cases)</span>
</div>
<div className="flex items-center gap-2">
<div className="w-3 h-3 rounded-full bg-tertiary-fixed border border-tertiary-fixed/50"></div>
<span>Warning (5-10 cases)</span>
</div>
</div>
</div>
</div>
</main>
</div>
    );
}