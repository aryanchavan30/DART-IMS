import React, { useState, useEffect } from 'react';
import apiService from '../../services/apiService.ts';
import { User } from '../../types';
import Card from '../ui/Card';
import { Gift } from 'lucide-react';

const BirthdayWidget: React.FC = () => {
    const [birthdays, setBirthdays] = useState<User[]>([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const users = await apiService.getUsers();
                const currentMonth = new Date().getMonth();
                const today = new Date().getDate();

                const upcomingBirthdays = users.filter(user => {
                    if (!user.dob) return false;
                    const dob = new Date(user.dob);
                    return dob.getMonth() === currentMonth && dob.getDate() >= today;
                }).sort((a,b) => new Date(a.dob).getDate() - new Date(b.dob).getDate());
                
                setBirthdays(upcomingBirthdays.slice(0, 5)); // show top 5 upcoming
            } catch (error) {
                console.error('Failed to fetch users for birthdays:', error);
            }
        };
        fetchUsers();
    }, []);

    if (birthdays.length === 0) {
        return null; // Don't render if no birthdays this month
    }

    return (
        <Card className="col-span-1 md:col-span-2">
            <h3 className="font-bold text-lg mb-4 flex items-center"><Gift size={20} className="mr-2 text-pink-500" /> Upcoming Birthdays</h3>
            <div className="space-y-3">
                {birthdays.map(user => (
                    <div key={user.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                            <img className="h-9 w-9 rounded-full mr-3" src={`https://i.pravatar.cc/150?u=${user.id}`} alt={user.name} />
                            <div>
                                <p className="font-semibold text-sm text-slate-800">{user.name}</p>
                                <p className="text-xs text-slate-500">{user.role}</p>
                            </div>
                        </div>
                        <p className="text-sm font-medium text-slate-600">
                            {new Date(user.dob).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default BirthdayWidget;