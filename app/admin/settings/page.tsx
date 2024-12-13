'use client';

import { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown, Plus, Key, LogOut, Trash, UserCircle } from 'lucide-react';
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import FooterAdminNav from "@/components/FooterAdminNav";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import PasswordInput from "@/components/PasswordInput";
// import LoadingProcessingPage from '@/components/ProcessLoading';

// Loading fallback component
const LoadingFallback: React.FC = () => (
    <div className="flex justify-center items-center h-full"></div>
);

interface AdminUser {
    id: number;
    email: string;
    lastActive: string;
    created: string;
}

interface User {
    UserEncodeID: string;
    ID: number;
    Email: string;
    LastLogin: string;
    CreatedAt: string;
}

type SortField = 'last_login' | 'created_at';
type SortOrder = 'asc' | 'desc' | '';

const UserAdminManagementPageContent: React.FC = () => {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const router = useRouter();
    const token = useAuthStore((state) => state.token);
    // const [isLoading, setIsLoading] = useState(false)

    const { toast } = useToast();

    const [isDialogDeleteOpen, setIsDialogDeleteOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

    const [isDialogCreateOpen, setIsDialogCreateOpen] = useState(false);
    const [newAdminEmail, setNewAdminEmail] = useState("");
    const [newAdminPassword, setNewAdminPassword] = useState("");

    const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false);
    const [isChangePasswordMyselfDialogOpen, setIsChangePasswordMyselfDialogOpen] = useState(false);
    const [passwordForAdmin, setPasswordForAdmin] = useState("");
    const [oldPasswordForAdmin, setOldPasswordForAdmin] = useState("");
    const [confirmPasswordForAdmin, setConfirmPasswordForAdmin] = useState("");
    const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
    const [selectedSuperAdmin, setSelectedSuperAdmin] = useState<AdminUser | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showOPassword, setShowOPassword] = useState(false);
    const [showCPassword, setShowCPassword] = useState(false);
    const roleId = useAuthStore((state) => state.roleId);
    const storedToken = useAuthStore.getState().getStoredToken();
    const [isMounted, setIsMounted] = useState(true);

    const [sortField, setSortField] = useState<SortField | null>(null);
    const [sortOrder, setSortOrder] = useState<SortOrder>('');

    // Authentication loaded state
    const [authLoaded, setAuthLoaded] = useState(false);

    // Initialize authLoaded on component mount
    useEffect(() => {
        setAuthLoaded(true);
    }, []);

    // Redirect users based on authentication and role
    useEffect(() => {
        if (!authLoaded) return;

        if (!storedToken) {
            router.replace("/");
            return;
        }

        if (roleId === 1) {
            router.replace("/not-found");
        }
    }, [authLoaded, storedToken, roleId, router]);

    const fetchUsers = async () => {
        try {
            // setIsLoading(true);
            if (!token) return;
            const sortFieldsString = sortField ? `${sortField} ${sortOrder}` : '';

            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/admin`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: {
                    sort_fields: sortFieldsString,
                }
            });

            if (isMounted) {
                const data = response.data.users.map((user: User) => ({
                    id: user.ID,
                    email: user.Email,
                    lastActive: new Date(user.LastLogin).toLocaleString(),
                    created: new Date(user.CreatedAt).toLocaleString(),
                }));
                setUsers(data);
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } 
        // finally {
        //     setIsLoading(false)
        // }
    };

    useEffect(() => {
        // Set mounted flag
        setIsMounted(true);

        // Initial fetch
        fetchUsers();

        // Set up interval for periodic fetching
        const intervalId = setInterval(() => {
            if (isMounted) {
                fetchUsers();
            }
        }, 3000); // Fetch every 3 seconds

        // Cleanup function
        return () => {
            setIsMounted(false);
            clearInterval(intervalId);
        };
    }, [token, sortField, sortOrder]); // Only depend on token, sortField, and sortOrder

    // If auth is not loaded yet or user is not authorized, show loading
    if (!authLoaded || roleId === 1) {
        return <LoadingFallback />;
    }

    const handleDeleteClick = (user: AdminUser) => {
        setSelectedUser(user);
        setIsDialogDeleteOpen(true);
    };

    // Function to handle "Change Password" button click
    const handleChangePasswordClick = (admin: AdminUser) => {
        setSelectedAdmin(admin);
        setIsChangePasswordDialogOpen(true);
    };

    const handleChangeMyselfPasswordClick = (admin: AdminUser) => {
        setSelectedSuperAdmin(admin);
        setIsChangePasswordMyselfDialogOpen(true);
    };

    const handleChangeMyPasswordSubmit = async () => {
        if (!selectedSuperAdmin) return;

        if (passwordForAdmin !== confirmPasswordForAdmin) {
            toast({
                description: "Passwords do not match.",
                variant: "destructive",
            });
            return;
        }

        if (passwordForAdmin.length < 6) {
            toast({
                description: "Password must be at least 6 characters long.",
                variant: "destructive",
            });
            return;
        }

        try {
            await axios.put(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/change_password/admin`,
                {
                    new_password: passwordForAdmin,
                    old_password: oldPasswordForAdmin,
                    user_id: selectedSuperAdmin.id
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            toast({
                description: "Your password changed successfully.",
                variant: "default",
            });

            // Reset state and close modal
            setIsChangePasswordMyselfDialogOpen(false);
            setPasswordForAdmin("");
            setOldPasswordForAdmin("");
            setConfirmPasswordForAdmin("");
            setSelectedSuperAdmin(null);

            // Optionally refresh the user list
            fetchUsers();
        } catch (error) {
            setPasswordForAdmin("");
            setOldPasswordForAdmin("");
            setConfirmPasswordForAdmin("");

            let errorMessage = "Failed to change your password. Please try again."
            if (axios.isAxiosError(error) && error.response?.data?.error) {
                errorMessage = error.response.data.error
            }
            toast({
                description: errorMessage,
                variant: "destructive",
            })
        }
    };

    // Function to handle password change submission
    const handleChangePasswordSubmit = async () => {
        if (!selectedAdmin) return;

        if (passwordForAdmin !== confirmPasswordForAdmin) {
            toast({
                description: "Passwords do not match.",
                variant: "destructive",
            });
            return;
        }

        if (passwordForAdmin.length < 6) {
            toast({
                description: "Password must be at least 6 characters long.",
                variant: "destructive",
            });
            return;
        }

        try {
            await axios.put(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/change_password/admin`,
                {
                    new_password: passwordForAdmin,
                    old_password: oldPasswordForAdmin,
                    user_id: selectedAdmin.id
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            toast({
                description: "Password changed successfully.",
                variant: "default",
            });

            // Reset state and close modal
            setIsChangePasswordDialogOpen(false);
            setIsChangePasswordMyselfDialogOpen(false);
            setPasswordForAdmin("");
            setOldPasswordForAdmin("");
            setConfirmPasswordForAdmin("");
            setSelectedAdmin(null);

            // Optionally refresh the user list
            fetchUsers();
        } catch (error) {
            setPasswordForAdmin("");
            setOldPasswordForAdmin("");
            setConfirmPasswordForAdmin("");
            setSelectedAdmin(null);

            let errorMessage = "Failed to change password. Please try again."
            if (axios.isAxiosError(error) && error.response?.data?.error) {
                errorMessage = error.response.data.error
            }
            toast({
                description: errorMessage,
                variant: "destructive",
            })
        }
    };

    const handleDeleteConfirm = async () => {
        if (!selectedUser) return;

        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/admin/${selectedUser.id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            // Remove the deleted user from the state
            setUsers((prevUsers) => prevUsers.filter((user) => user.id !== selectedUser.id));
            setIsDialogDeleteOpen(false);
            setSelectedUser(null);

            // Show success toast
            toast({
                description: newAdminEmail + " admin deleted successfully!",
                variant: "default",
            });
        } catch (error) {
            let errorMessage = "Failed to delete admin. Please try again."
            if (axios.isAxiosError(error) && error.response?.data?.error) {
                errorMessage = error.response.data.error
            }
            toast({
                description: errorMessage,
                variant: "destructive",
            })
        }
    };

    const handleCreateAdmin = async () => {
        if (!newAdminEmail || !newAdminPassword) {
            toast({
                title: "Error",
                description: "Please fill all required fields",
                variant: "destructive",
            });
            return;
        }

        if (newAdminPassword.length < 6) {
            toast({
                description: "Password must be at least 6 characters long.",
                variant: "destructive",
            });
            return;
        }

        try {
            await axios.post(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/admin`,
                {
                    username: newAdminEmail,
                    password: newAdminPassword,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            // Show success toast
            toast({
                description: newAdminEmail + " admin has been successfully created!",
                variant: "default",
            });

            // Close the dialog and reset the form
            setIsDialogCreateOpen(false);
            setNewAdminEmail("");
            setNewAdminPassword("");

            // Refresh the user list
            fetchUsers();
        } catch (error) {
            let errorMessage = "Failed to create admin. Please try again."
            if (axios.isAxiosError(error) && error.response?.data?.error) {
                errorMessage = error.response.data.error
            }
            toast({
                description: errorMessage,
                variant: "destructive",
            })
        }
    };

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            if (sortOrder === 'asc') {
                setSortOrder('desc');
            } else if (sortOrder === 'desc') {
                setSortField(null);
                setSortOrder('');
            } else {
                setSortOrder('asc');
            }
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const handleLogout = () => {
        // Clear token and redirect to login page
        useAuthStore.getState().setToken(null);
        router.push('/');
    }

    return (
        <div className="p-6 space-y-2">
            <div className="flex-1 overflow-auto pb-20">
                <div className="overflow-auto p-4 pb-20 ">
                    <Toaster />

                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-400 hover:bg-gray-400">
                                <TableHead className="text-center text-black font-bold" style={{ width: '150px' }}>Name</TableHead>
                                <TableHead className="text-center text-black font-bold" style={{ width: '100px' }}>
                                    <Button
                                        variant="ghost"
                                        onClick={() => toggleSort('last_login')}
                                        className="font-bold text-black hover:bg-gray-500"
                                    >
                                        Last Active
                                        {sortField === 'last_login' && sortOrder === 'asc' ? (
                                            <ArrowUp className="ml-2 h-4 w-4" />
                                        ) : sortField === 'last_login' && sortOrder === 'desc' ? (
                                            <ArrowDown className="ml-2 h-4 w-4" />
                                        ) : (
                                            <>
                                                <ArrowUpDown className="ml-2 h-4 w-4 text-gray-500" />
                                            </>
                                        )}
                                    </Button>
                                </TableHead>
                                <TableHead className="text-center text-black font-bold" style={{ width: '100px' }}>
                                    <Button
                                        variant="ghost"
                                        onClick={() => toggleSort('created_at')}
                                        className="font-bold text-black hover:bg-gray-500"
                                    >
                                        Created
                                        {sortField === 'created_at' && sortOrder === 'asc' ? (
                                            <ArrowUp className="ml-2 h-4 w-4" />
                                        ) : sortField === 'created_at' && sortOrder === 'desc' ? (
                                            <ArrowDown className="ml-2 h-4 w-4" />
                                        ) : (
                                            <>
                                                <ArrowUpDown className="ml-2 h-4 w-4 text-gray-500" />
                                            </>
                                        )}
                                    </Button>
                                </TableHead>
                                <TableHead className="text-center text-black font-bold" style={{ width: '300px' }}>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.email}>
                                    <TableCell className="px-2 py-1 text-center" style={{ width: '150px' }}>{user.email}</TableCell>
                                    <TableCell className="px-2 py-1 text-center" style={{ width: '100px' }}>{user.lastActive}</TableCell>
                                    <TableCell className="px-2 py-1 text-center" style={{ width: '100px' }}>{user.created}</TableCell>
                                    <TableCell className="px-2 py-1 space-x-2 text-center" style={{ width: '300px' }}>
                                        <Button
                                            variant="secondary"
                                            className="shadow appearance-non bg-blue-100 hover:bg-blue-200 text-blue-800"
                                            onClick={() => handleChangePasswordClick(user)}
                                        >
                                            <Key className="w-4 h-4 mr-2" />
                                            Change Password
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            className="shadow appearance-non bg-white border border-red-500 text-red-500 hover:bg-red-100"
                                            onClick={() => handleDeleteClick(user)}
                                        >
                                            <Trash className="w-4 h-4 mr-2" />
                                            Delete
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <Dialog open={isChangePasswordDialogOpen} onOpenChange={setIsChangePasswordDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Change Password for {selectedAdmin?.email}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <PasswordInput
                                    id="password"
                                    placeholder="New Password"
                                    value={passwordForAdmin}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setPasswordForAdmin(value.replace(/\s/g, '')); // Remove spaces
                                    }}
                                    showPassword={showPassword}
                                    setShowPassword={setShowPassword}
                                />
                                <PasswordInput
                                    id="password"
                                    placeholder="Confirm Password"
                                    value={confirmPasswordForAdmin}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setConfirmPasswordForAdmin(value.replace(/\s/g, '')); // Remove spaces
                                    }}
                                    showPassword={showCPassword}
                                    setShowPassword={setShowCPassword}
                                />
                            </div>
                            <DialogFooter>
                                <Button className='shadow appearance-non w-1/2 bg-white border border-yellow-500 text-yellow-500 hover:bg-yellow-100' variant="secondary" onClick={() => {
                                    setIsChangePasswordDialogOpen(false);
                                    setPasswordForAdmin("");
                                    setConfirmPasswordForAdmin("");
                                    setSelectedAdmin(null);
                                }}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className={`shadow appearance-non w-1/2 max-w-xs font-bold text-black ${!passwordForAdmin || !confirmPasswordForAdmin
                                        ? "bg-gray-300 cursor-not-allowed"
                                        : "bg-[#ffeeac] hover:bg-yellow-300"
                                        }`}
                                    disabled={!passwordForAdmin || !confirmPasswordForAdmin}
                                    onClick={handleChangePasswordSubmit}>
                                    Submit
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isChangePasswordMyselfDialogOpen} onOpenChange={setIsChangePasswordMyselfDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Change Password for {selectedSuperAdmin?.email}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <PasswordInput
                                    id="old-password"
                                    placeholder="Old Password"
                                    value={oldPasswordForAdmin}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setOldPasswordForAdmin(value.replace(/\s/g, '')); // Remove spaces
                                    }}
                                    showPassword={showOPassword}
                                    setShowPassword={setShowOPassword}
                                />
                                <PasswordInput
                                    id="password"
                                    placeholder="New Password"
                                    value={passwordForAdmin}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setPasswordForAdmin(value.replace(/\s/g, '')); // Remove spaces
                                    }}
                                    showPassword={showPassword}
                                    setShowPassword={setShowPassword}
                                />
                                <PasswordInput
                                    id="password"
                                    placeholder="Confirm Password"
                                    value={confirmPasswordForAdmin}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setConfirmPasswordForAdmin(value.replace(/\s/g, '')); // Remove spaces
                                    }}
                                    showPassword={showCPassword}
                                    setShowPassword={setShowCPassword}
                                />
                            </div>
                            <DialogFooter>
                                <Button className='shadow appearance-non w-1/2 bg-white border border-yellow-500 text-yellow-500 hover:bg-yellow-100' variant="secondary" onClick={() => {
                                    setIsChangePasswordDialogOpen(false);
                                    setIsChangePasswordMyselfDialogOpen(false);
                                    setPasswordForAdmin("");
                                    setConfirmPasswordForAdmin("");
                                    setSelectedSuperAdmin(null);
                                }}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className={`shadow appearance-non w-1/2 max-w-xs font-bold text-black ${!passwordForAdmin || !oldPasswordForAdmin || !confirmPasswordForAdmin
                                        ? "bg-gray-300 cursor-not-allowed"
                                        : "bg-[#ffeeac] hover:bg-yellow-300"
                                        }`}
                                    disabled={!passwordForAdmin || !oldPasswordForAdmin || !confirmPasswordForAdmin}
                                    onClick={handleChangeMyPasswordSubmit}>
                                    Submit
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isDialogDeleteOpen} onOpenChange={setIsDialogDeleteOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Delete Confirmation</DialogTitle>
                            </DialogHeader>
                            <p>Are you sure you want to delete admin {selectedUser?.email}?</p>
                            <DialogFooter>
                                <Button className='shadow appearance-non w-1/2 bg-white border border-yellow-500 text-yellow-500 hover:bg-yellow-100' variant="secondary" onClick={() => setIsDialogDeleteOpen(false)}>Cancel</Button>
                                <Button variant="destructive" className='shadow appearance-non w-1/2' onClick={handleDeleteConfirm}>Confirm</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isDialogCreateOpen} onOpenChange={setIsDialogCreateOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Admin</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="mb-4">
                                    <div className="relative flex items-center">
                                        <UserCircle className="absolute left-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                                        <Input
                                            className="pl-10 shadow-sm border border-gray-200 w-full"
                                            placeholder="Username"
                                            value={newAdminEmail}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setNewAdminEmail(value.replace(/\s/g, '')); // Remove spaces
                                            }}
                                        />
                                    </div>
                                </div>
                                <PasswordInput
                                    id="password"
                                    placeholder="Password"
                                    value={newAdminPassword}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setNewAdminPassword(value.replace(/\s/g, '')); // Remove spaces
                                    }}
                                    showPassword={showPassword}
                                    setShowPassword={setShowPassword}
                                />
                                {/* <PasswordInput
                                    className='shadow appearance-non '
                                    placeholder="Password"
                                    type="password"
                                    value={newAdminPassword}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setNewAdminPassword(value.replace(/\s/g, '')); // Remove spaces
                                    }}
                                /> */}
                            </div>
                            <DialogFooter>
                                <Button variant="secondary" className='shadow appearance-non w-1/2 bg-white border border-yellow-500 text-yellow-500 hover:bg-yellow-100'
                                    onClick={() => {
                                        setIsDialogCreateOpen(false);
                                        setNewAdminEmail("");
                                        setNewAdminPassword("");
                                    }
                                    }>
                                    Back
                                </Button>
                                <Button
                                    variant="default"
                                    className={`w-1/2  font-bold shadow appearance-non w-1/2 text-black ${!newAdminEmail || !newAdminPassword
                                        ? "bg-gray-300 cursor-not-allowed"
                                        : "bg-[#ffeeac] hover:bg-yellow-300"
                                        }`}
                                    disabled={!newAdminEmail || !newAdminPassword}
                                    onClick={handleCreateAdmin}>Confirm</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="fixed bottom-10 left-0 right-0 p-4">
                    <div className="container mx-auto px-4 py-3">
                        <div className="flex justify-center items-center gap-4">
                            <Button
                                className="flex-1 max-w-[300px] shadow appearance-non bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-semibold py-2.5 rounded-lg transition-colors"
                                onClick={() => setIsDialogCreateOpen(true)}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create Admin
                            </Button>
                            <Button
                                className="flex-1 max-w-[300px] shadow appearance-non bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold py-2.5 rounded-lg border border-gray-300 transition-colors"
                                onClick={() => handleChangeMyselfPasswordClick({ id: 0, email: "Myself", lastActive: "", created: "" })}
                            >
                                <Key className="w-4 h-4 mr-2" />
                                Change Password
                            </Button>
                            <Button
                                className="flex-1 max-w-[300px] shadow appearance-non bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2.5 rounded-lg border border-red-200 transition-colors"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            {/* {isLoading && (
                <LoadingProcessingPage />
            )} */}
            <FooterAdminNav />
        </div>
    )
}

// Wrap the content component with Suspense
const UserAdminManagementPage: React.FC = () => (
    <Suspense fallback={<LoadingFallback />}>
      <UserAdminManagementPageContent />
    </Suspense>
  );
  
export default UserAdminManagementPage