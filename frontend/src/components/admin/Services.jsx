import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/cropImage';

const Services = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null); // null = list, {} = create, {id...} = edit
    const [iconPreview, setIconPreview] = useState('');

    // Image Upload & Crop State
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [showCropper, setShowCropper] = useState(false);
    const [croppedImageBlob, setCroppedImageBlob] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        fetchServices();
    }, []);

    useEffect(() => {
        if (editing) {
            setIconPreview(editing.icon || '');
            setPreviewUrl(editing.image || null);
            setCroppedImageBlob(null);
            setSelectedFile(null);
            setImageSrc(null);
            setShowCropper(false);
            setZoom(1);
            setCrop({ x: 0, y: 0 });
        }
    }, [editing]);

    const fetchServices = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (user && user.id) {
                const res = await axios.get(`/api/services?salao_id=${user.id}`);
                setServices(res.data);
            }
        } catch (error) {
            console.error("Erro ao carregar serviços", error);
        } finally {
            setLoading(false);
        }
    };

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleFileChange = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setSelectedFile(file);
            
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImageSrc(reader.result);
                setPreviewUrl(reader.result);
                setShowCropper(true);
                setZoom(1);
                setCrop({ x: 0, y: 0 });
            });
            reader.readAsDataURL(file);
        }
    };

    const handleCropSave = async () => {
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
            setCroppedImageBlob(croppedImage);
            setPreviewUrl(URL.createObjectURL(croppedImage));
            setShowCropper(false);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        let imagePath = editing.image;

        const fileToUpload = croppedImageBlob || selectedFile;

        if (fileToUpload) {
            const uploadData = new FormData();
            // If it's a blob (cropped), give it a name. If it's a file, it already has one, but we can override or let it be.
            // Multer usually takes the filename from the FormData.
            uploadData.append('image', fileToUpload, fileToUpload.name || 'service.jpg');
            try {
                // Get token for auth middleware
                const token = localStorage.getItem('token');
                const config = {
                    headers: { 
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}` 
                    }
                };
                
                const res = await axios.post('/api/upload', uploadData, config);
                imagePath = res.data.path;
            } catch (error) {
                console.error("Erro no upload", error);
                alert('Erro ao fazer upload da imagem');
                return;
            }
        }

        const data = {
            name: formData.get('name'),
            price: Number(formData.get('price')),
            duration: Number(formData.get('duration')),
            icon: formData.get('icon'),
            image: imagePath
        };

        try {
            if (editing._id) {
                await axios.put(`/api/services/${editing._id}`, data);
            } else {
                await axios.post('/api/services', data);
            }
            setEditing(null);
            fetchServices();
        } catch (error) {
            alert('Erro ao salvar serviço');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza?')) return;
        try {
            await axios.delete(`/api/services/${id}`);
            fetchServices();
        } catch (error) {
            alert('Erro ao deletar');
        }
    };

    if (loading) return <div>Carregando...</div>;

    if (editing) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm max-w-lg">
                <h3 className="text-xl font-bold mb-4">{editing._id ? 'Editar Serviço' : 'Novo Serviço'}</h3>
                
                {showCropper && (
                     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
                        <div className="bg-white p-4 rounded-lg w-full max-w-md">
                            <h4 className="text-lg font-bold mb-2">Ajustar Imagem</h4>
                            <div className="relative h-64 w-full bg-gray-200 mb-4">
                                <Cropper
                                    image={imageSrc}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1}
                                    onCropChange={setCrop}
                                    onCropComplete={onCropComplete}
                                    onZoomChange={setZoom}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Zoom</label>
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    aria-labelledby="Zoom"
                                    onChange={(e) => setZoom(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowCropper(false)} className="px-4 py-2 border rounded text-gray-600">Cancelar</button>
                                <button type="button" onClick={handleCropSave} className="px-4 py-2 bg-blue-600 text-white rounded">Confirmar Corte</button>
                            </div>
                        </div>
                    </div>
                )}

                <form key={editing._id || 'new'} onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nome do Serviço</label>
                        <input name="name" defaultValue={editing.name || ''} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
                    </div>
                    
                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Imagem do Serviço</label>
                        <div className="mt-2 flex items-center gap-4">
                            <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xs text-gray-400">Sem imagem</span>
                                )}
                            </div>
                            <label className="cursor-pointer bg-white border border-gray-300 rounded-md shadow-sm px-4 py-2 inline-flex items-center text-sm font-medium text-gray-700 hover:bg-gray-50">
                                Selecionar Imagem
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Formato quadrado recomendado.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Preço (R$)</label>
                            <input name="price" type="number" step="0.01" defaultValue={editing.price || ''} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Duração (min)</label>
                            <input name="duration" type="number" defaultValue={editing.duration || ''} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Ícone (Opcional se tiver imagem)</label>
                        <div className="flex gap-2 items-center">
                            <input 
                                name="icon" 
                                defaultValue={editing.icon || ''} 
                                onChange={(e) => setIconPreview(e.target.value)}
                                placeholder="ex: fa-solid fa-scissors"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" 
                            />
                            <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded border flex-shrink-0">
                                {iconPreview ? <i className={`${iconPreview} text-gray-700 text-lg`}></i> : <span className="text-xs text-gray-400">N/A</span>}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                        <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 border rounded text-gray-600">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Salvar</button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Serviços</h2>
                <button onClick={() => setEditing({})} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    + Novo Serviço
                </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serviço</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duração</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {services.map(s => (
                            <tr key={s._id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                                            {s.image ? (
                                                <img src={s.image} alt={s.name} className="h-full w-full object-cover" />
                                            ) : (
                                                s.icon ? <i className={`${s.icon} text-gray-500`}></i> : <span className="text-xs text-gray-400">img</span>
                                            )}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{s.name}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-600">R$ {s.price.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-600">{s.duration} min</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => setEditing(s)} className="text-blue-600 hover:text-blue-900 mr-4">Editar</button>
                                    <button onClick={() => handleDelete(s._id)} className="text-red-600 hover:text-red-900">Excluir</button>
                                </td>
                            </tr>
                        ))}
                        {services.length === 0 && (
                            <tr>
                                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">Nenhum serviço cadastrado.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Services;
