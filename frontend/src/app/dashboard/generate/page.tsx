'use client';
import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { reportsAPI } from '@/lib/api';
import { useReportStore } from '@/store';
import toast from 'react-hot-toast';
import {
    Building2, Users, BarChart3, Upload, Image, FileSpreadsheet,
    X, Loader2, Sparkles, ChevronRight, Info, PieChart, BarChart2,
    TrendingUp, CheckCircle, Calendar, FileText
} from 'lucide-react';

const REPORT_TYPES = [
    {
        id: 'drive',
        label: 'Campus Drive Report',
        icon: Building2,
        color: 'blue',
        description: 'For company campus drives — selections, attendance, job details, KPI scoring',
        examples: ['Jaro Education Drive', 'TCS Campus Visit', 'Infosys Recruitment'],
    },
    {
        id: 'session',
        label: 'Session Report',
        icon: Users,
        color: 'purple',
        description: 'For training sessions, talks, workshops, guest lectures',
        examples: ['LinkedIn FACE Session', 'Mock Interview Workshop', 'Resume Building Talk'],
    },
    {
        id: 'management',
        label: 'Weekly Management Report',
        icon: BarChart3,
        color: 'emerald',
        description: 'Weekly HOD/management summary with KPIs and placement stats',
        examples: ['HOD Weekly Report', 'Monthly Placement Update', 'T&P Progress Report'],
    },
];

const CHART_OPTIONS = [
    { id: 'pie_selection', label: 'Selection Ratio (Pie)', icon: PieChart },
    { id: 'bar_attendance', label: 'Attendance by Branch (Bar)', icon: BarChart2 },
    { id: 'bar_placement', label: 'Placement Trend (Bar)', icon: TrendingUp },
];

export default function GeneratePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setGenerating, setCurrentReport } = useReportStore();

    const [step, setStep] = useState(1);
    const [reportType, setReportType] = useState(searchParams?.get('type') || '');
    const [rawText, setRawText] = useState('');
    const [images, setImages] = useState<File[]>([]);
    const [excelFile, setExcelFile] = useState<File | null>(null);
    const [selectedCharts, setSelectedCharts] = useState<string[]>(['pie_selection', 'bar_attendance']);
    const [collegeInfo, setCollegeInfo] = useState({
        collegeName: 'JSPM\'s Jayawantrao Sawant College of Engineering',
        academicYear: '2025-26',
    });
    const [loading, setLoading] = useState(false);

    const onDropImages = useCallback((acceptedFiles: File[]) => {
        setImages((prev) => [...prev, ...acceptedFiles].slice(0, 20));
    }, []);

    const { getRootProps: getImgProps, getInputProps: getImgInput, isDragActive: imgDrag } = useDropzone({
        onDrop: onDropImages,
        accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'] },
        maxFiles: 20,
    });

    const { getRootProps: getExcelProps, getInputProps: getExcelInput } = useDropzone({
        onDrop: (files) => setExcelFile(files[0]),
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
            'text/csv': ['.csv'],
        },
        maxFiles: 1,
    });

    const removeImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    const toggleChart = (id: string) => {
        setSelectedCharts((prev) =>
            prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
        );
    };

    const handleGenerate = async () => {
        if (!reportType) { toast.error('Select a report type'); return; }
        if (!rawText.trim() || rawText.trim().length < 50) {
            toast.error('Please provide at least 50 characters of report content');
            return;
        }

        setLoading(true);
        setGenerating(true);
        const toastId = toast.loading('⚙️ Processing your report... This may take 20-40 seconds.');

        try {
            const formData = new FormData();
            formData.append('reportType', reportType);
            formData.append('rawText', rawText);
            formData.append('collegeInfo', JSON.stringify(collegeInfo));
            formData.append('chartConfig', JSON.stringify(selectedCharts));

            images.forEach((img) => formData.append('images', img));
            if (excelFile) formData.append('excel', excelFile);

            const res = await reportsAPI.generate(formData);
            const { reportId, structuredData } = res.data;

            setCurrentReport({ id: reportId, ...structuredData });
            toast.success('✅ Report generated successfully!', { id: toastId });
            router.push(`/dashboard/reports/${reportId}`);
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Generation failed. Check your API key.', { id: toastId });
        } finally {
            setLoading(false);
            setGenerating(false);
        }
    };

    const selectedType = REPORT_TYPES.find((t) => t.id === reportType);

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
            {/* Header Area */}
            <div className="flex flex-col">
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                    <Sparkles size={28} className="text-blue-600" />
                    Generate Report
                </h1>
                <p className="text-[15px] font-medium text-slate-500 mt-1">
                    Convert raw documentation into professional structured ERP reports.
                </p>
            </div>

            {/* Progress Steps Indicator */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {['Report Type', 'Content', 'Attachments', 'Review'].map((label, idx) => {
                    const num = idx + 1;
                    const isActive = step === num;
                    const isDone = step > num;
                    return (
                        <div key={label} className="flex items-center flex-shrink-0">
                            <button
                                onClick={() => num < step && setStep(num)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' :
                                    isDone ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-pointer' :
                                        'bg-white border border-slate-200 text-slate-400 cursor-default'
                                    }`}
                            >
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${isDone ? 'bg-emerald-500 text-white' : isActive ? 'bg-white text-blue-600' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                    {isDone ? <CheckCircle size={12} /> : num}
                                </span>
                                {label}
                            </button>
                            {idx < 3 && <ChevronRight size={14} className="text-slate-300 mx-2" />}
                        </div>
                    );
                })}
            </div>

            {/* Step 1: Report Type Selection */}
            {step === 1 && (
                <div className="space-y-6 animate-fade-in">
                    <h2 className="text-lg font-bold text-slate-800">Select Report Category</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {REPORT_TYPES.map((type) => {
                            const Icon = type.icon;
                            const isSelected = reportType === type.id;
                            return (
                                <button
                                    key={type.id}
                                    onClick={() => setReportType(type.id)}
                                    className={`card text-left flex flex-col items-start transition-all duration-300 ${isSelected
                                        ? 'border-blue-600 bg-white ring-2 ring-blue-600 shadow-xl scale-[1.02]'
                                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-colors ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                                        }`}>
                                        <Icon size={24} />
                                    </div>
                                    <h3 className={`font-bold text-[15px] mb-2 transition-colors ${isSelected ? 'text-blue-700' : 'text-slate-200'}`}>
                                        {type.label}
                                    </h3>
                                    <p className={`text-[12px] font-medium mb-4 leading-relaxed transition-colors ${isSelected ? 'text-slate-600' : 'text-slate-400'}`}>
                                        {type.description}
                                    </p>
                                    <div className="space-y-1 mt-auto">
                                        {type.examples.slice(0, 2).map((ex) => (
                                            <div key={ex} className={`text-[11px] font-bold flex items-center gap-1.5 transition-colors ${isSelected ? 'text-blue-600/60' : 'text-slate-500'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-blue-400' : 'bg-slate-700'}`} />
                                                {ex}
                                            </div>
                                        ))}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Criteria Input (JSPM PRISM Style) */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                        <h3 className="text-[15px] font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                            Refine Criteria
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="input-label">University / College</label>
                                <input
                                    className="input-field"
                                    value={collegeInfo.collegeName}
                                    onChange={(e) => setCollegeInfo({ ...collegeInfo, collegeName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="input-label">Academic Year</label>
                                <input
                                    className="input-field"
                                    value={collegeInfo.academicYear}
                                    onChange={(e) => setCollegeInfo({ ...collegeInfo, academicYear: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            onClick={() => {
                                if (!reportType) { toast.error('Select a report type'); return; }
                                setStep(2);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
                        >
                            Next Step <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Content Input */}
            {step === 2 && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            {selectedType && <selectedType.icon size={20} className="text-blue-600" />}
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">{selectedType?.label} Documentation</h2>
                    </div>

                    {/* AI Prompt Tips */}
                    <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl flex gap-4">
                        <div className="bg-white p-2 rounded-xl shadow-sm self-start">
                            <Info size={18} className="text-blue-600" />
                        </div>
                        <div className="text-[13px] text-blue-800 leading-relaxed">
                            <p className="font-bold mb-1">Report Guidance:</p>
                            <p className="text-blue-600 font-medium opacity-90">Include company names, numerical data for attendance/registrations, and specific results. The system will automatically format this into tables and KPI charts.</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="input-label flex items-center justify-between">
                            <span>Paragraph Content / Raw Text <span className="text-red-500 font-bold">*</span></span>
                            <span className="text-slate-400 font-bold normal-case">{rawText.length} chars</span>
                        </label>
                        <textarea
                            id="rawText"
                            className="input-field min-h-[400px] leading-relaxed"
                            placeholder="Type or paste your report details here..."
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button onClick={() => setStep(1)} className="px-8 py-3.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all">
                            Back
                        </button>
                        <button onClick={() => setStep(3)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 ml-auto">
                            Continue <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Attachments Area */}
            {step === 3 && (
                <div className="space-y-8 animate-fade-in">
                    <h2 className="text-lg font-bold text-slate-800">Visuals & Data Enrichment</h2>

                    {/* Chart configuration */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                        <h3 className="font-bold text-slate-800 text-[15px] mb-5 flex items-center gap-3">
                            <BarChart3 size={18} className="text-blue-600" /> Include Dynamic Charts
                        </h3>
                        <div className="grid sm:grid-cols-3 gap-4">
                            {CHART_OPTIONS.map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    onClick={() => toggleChart(id)}
                                    className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all gap-3 ${selectedCharts.includes(id)
                                        ? 'border-blue-600 bg-blue-50/50 text-blue-700'
                                        : 'border-slate-100 text-slate-400 hover:border-slate-200'
                                        }`}
                                >
                                    <Icon size={24} />
                                    <span className="text-center text-[12px] font-bold">{label}</span>
                                    {selectedCharts.includes(id) && <CheckCircle size={16} className="text-blue-600" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Photo upload Box */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                        <h3 className="font-bold text-slate-800 text-[15px] mb-5 flex items-center gap-3">
                            <Image size={18} className="text-blue-600" /> Drive / Session Photos
                        </h3>
                        <div
                            {...getImgProps()}
                            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${imgDrag ? 'bg-blue-50 border-blue-400' : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/20'}`}
                        >
                            <input {...getImgInput()} />
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Upload size={24} className="text-blue-600" />
                            </div>
                            <p className="text-[14px] font-bold text-slate-700">Add event images</p>
                            <p className="text-[12px] font-medium text-slate-400 mt-1">Up to 20 images allowed</p>
                        </div>

                        {images.length > 0 && (
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mt-8">
                                {images.map((file, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={file.name}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                        />
                                        <button
                                            onClick={() => removeImage(idx)}
                                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg transform translate-x-8 group-hover:translate-x-0 transition-transform"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Student Data (Excel) */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                        <h3 className="font-bold text-slate-800 text-[15px] mb-5 flex items-center gap-3">
                            <FileSpreadsheet size={18} className="text-blue-600" /> External Excel Records
                        </h3>
                        {excelFile ? (
                            <div className="flex items-center gap-4 p-5 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                <div className="p-3 bg-white rounded-xl shadow-sm">
                                    <FileSpreadsheet size={24} className="text-emerald-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[14px] font-bold text-slate-800">{excelFile.name}</p>
                                    <p className="text-[11px] font-bold text-slate-400">Excel Dataset • {(excelFile.size / 1024).toFixed(1)} KB</p>
                                </div>
                                <button onClick={() => setExcelFile(null)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                        ) : (
                            <div {...getExcelProps()} className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center hover:bg-slate-50 transition-colors cursor-pointer">
                                <input {...getExcelInput()} />
                                <Upload size={28} className="mx-auto text-slate-300 mb-4" />
                                <p className="text-[14px] font-bold text-slate-600 tracking-tight">Select Student Master Data</p>
                                <p className="text-[12px] font-medium text-slate-400 mt-1">Directly sync registration counts</p>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button onClick={() => setStep(2)} className="px-8 py-3.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all">Back</button>
                        <button onClick={() => setStep(4)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 ml-auto">
                            Final Review <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 4: Final Summary & Dispatch */}
            {step === 4 && (
                <div className="space-y-6 animate-fade-in">
                    <h2 className="text-lg font-bold text-slate-800">Final Verification</h2>

                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-blue-700 font-extrabold text-[15px] uppercase tracking-wider mb-1">Deployment Summary</h3>
                            <p className="text-slate-500 text-[13px] font-medium">Verify your data before submitting.</p>
                        </div>

                        <div className="p-8 grid sm:grid-cols-2 gap-8">
                            {[
                                { label: 'Selected Category', value: selectedType?.label || reportType, icon: Building2 },
                                { label: 'Institutional Body', value: collegeInfo.collegeName, icon: Users },
                                { label: 'Academic cycle', value: collegeInfo.academicYear, icon: Calendar },
                                { label: 'Content Payload', value: `${rawText.length} characters`, icon: FileText },
                                { label: 'Visual Evidence', value: `${images.length} photos`, icon: Image },
                                { label: 'Excel Integration', value: excelFile ? 'Active' : 'Not Provided', icon: FileSpreadsheet },
                            ].map(({ label, value, icon: Icon }) => (
                                <div key={label} className="flex gap-4">
                                    <div className="p-2.5 bg-slate-50 rounded-xl h-fit border border-slate-100">
                                        <Icon size={18} className="text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                                        <p className="text-[14px] font-extrabold text-slate-800 mt-0.5">{value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mx-8 mb-8 p-5 bg-blue-600 rounded-2xl flex items-center gap-4 text-white shadow-lg shadow-blue-600/30">
                            <div className="p-2.5 bg-white/20 rounded-xl">
                                <Sparkles size={22} />
                            </div>
                            <div className="text-[13px] font-medium leading-tight">
                                The system will now process this documentation, fix all linguistic errors, and generate a pixel-perfect institutional report.
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button onClick={() => setStep(3)} className="px-8 py-3.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all" disabled={loading}>Back</button>
                        <button onClick={handleGenerate} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 py-3.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 ml-auto" disabled={loading}>
                            {loading ? (
                                <><Loader2 size={18} className="animate-spin" /> Synthesizing Content...</>
                            ) : (
                                <><Sparkles size={18} /> Generate Report</>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
