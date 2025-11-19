
import React from 'react';
import {
  Home, Users, Briefcase, FileText, UserCheck, DollarSign, IndianRupee, Calendar, LogOut, ChevronDown, ChevronUp, Clock,
  MapPin, Send, CheckCircle, XCircle, AlertTriangle, Info, Bell, Settings, FilePlus, Upload, Download,
  Filter, Eye, Edit, Trash2, MoreVertical, Search, ClipboardList, UserPlus, Milestone, Menu, PieChart, UploadCloud, File,
  Check, X, User, RotateCw, Save
} from 'lucide-react';

const iconClass = "h-5 w-5";

export const HomeIcon = () => <Home className={iconClass} />;
export const UsersIcon = () => <Users className={iconClass} />;
export const BriefcaseIcon = () => <Briefcase className={iconClass} />;
export const FileTextIcon = () => <FileText className={iconClass} />;
export const UserCheckIcon = () => <UserCheck className={iconClass} />;
export const DollarSignIcon = () => <DollarSign className={iconClass} />;
export const IndianRupeeIcon = () => <IndianRupee className={iconClass} />;
export const CalendarIcon = () => <Calendar className={iconClass} />;
export const LogOutIcon = () => <LogOut className={iconClass} />;
export const ChevronDownIcon = () => <ChevronDown className={iconClass} />;
export const ChevronUpIcon = () => <ChevronUp className={iconClass} />;
export const ClockIcon = () => <Clock className="h-4 w-4 mr-2 inline" />;
export const MapPinIcon = () => <MapPin className="h-4 w-4 mr-2 inline" />;
export const SendIcon = () => <Send className="h-4 w-4 ml-2" />;
export const CheckCircleIcon = () => <CheckCircle className="h-5 w-5 text-green-500" />;
export const XCircleIcon = () => <XCircle className="h-5 w-5 text-red-500" />;
export const AlertTriangleIcon = () => <AlertTriangle className="h-5 w-5 text-amber-500" />;
export const InfoIcon = () => <Info className="h-5 w-5 text-blue-500" />;
export const BellIcon = () => <Bell className={iconClass} />;
export const SettingsIcon = () => <Settings className={iconClass} />;
export const FilePlusIcon = () => <FilePlus className="h-4 w-4 mr-2" />;
export const UploadIcon = () => <Upload className="h-4 w-4 mr-2" />;
export const DownloadIcon = () => <Download className="h-4 w-4 mr-2" />;
export const FilterIcon = () => <Filter className="h-4 w-4 mr-2" />;
export const EyeIcon = () => <Eye className="h-5 w-5" />;
export const EditIcon = () => <Edit className="h-4 w-4 mr-2" />;
export const Trash2Icon = () => <Trash2 className="h-5 w-5" />;
export const MoreVerticalIcon = () => <MoreVertical className="h-5 w-5" />;
export const SearchIcon = () => <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />;
export const ClipboardListIcon = () => <ClipboardList className={iconClass} />;
export const UserPlusIcon = () => <UserPlus className={iconClass} />;
export const MilestoneIcon = () => <Milestone className={iconClass} />;
export const MenuIcon = () => <Menu className={iconClass} />;
export const PieChartIcon = () => <PieChart className={iconClass} />;
// FIX: Add UploadCloudIcon and FileIcon for use in InterviewAssessment page.
export const UploadCloudIcon = () => <UploadCloud className="h-10 w-10 text-slate-400 mb-2 mx-auto" />;
export const FileIcon = () => <File className="h-10 w-10 text-slate-400 mb-2 mx-auto" />;

// Additional icons for ExtensionPermissions component
export const CheckIcon = () => <Check className={iconClass} />;
export const XIcon = () => <X className={iconClass} />;
export const UserIcon = () => <User className={iconClass} />;

// Sync/Refresh icon
export const RefreshIcon = () => <RotateCw className={iconClass} />;
export const SaveIcon = () => <Save className={iconClass}/>