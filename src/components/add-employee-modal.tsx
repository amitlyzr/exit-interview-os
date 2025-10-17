"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface AddEmployeeModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onAddEmployee: (employee: {
        employeeName: string
        email: string
        tenure: string
        role: string
        level: string
    }) => void
}

const employeeRoles = [
    { id: "manager", name: "Manager" },
    { id: "developer", name: "Developer" },
    { id: "designer", name: "Designer" },
    { id: "analyst", name: "Analyst" },
    { id: "marketing", name: "Marketing" },
    { id: "sales", name: "Sales" },
    { id: "hr", name: "Human Resources" },
    { id: "finance", name: "Finance" },
    { id: "operations", name: "Operations" },
    { id: "other", name: "Other" },
]

const employeeLevels = [
    { id: "junior", name: "Junior" },
    { id: "mid-level", name: "Mid-Level" },
    { id: "senior", name: "Senior" },
    { id: "lead", name: "Lead" },
    { id: "director", name: "Director" },
    { id: "vp", name: "VP" },
    { id: "c-level", name: "C-Level" },
]

export function AddEmployeeModal({
    open,
    onOpenChange,
    onAddEmployee
}: AddEmployeeModalProps) {
    const [formData, setFormData] = useState({
        employeeName: "",
        email: "",
        tenure: "",
        role: "",
        level: "",
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (Object.values(formData).every(value => value.trim() !== "")) {
            onAddEmployee(formData)
            setFormData({
                employeeName: "",
                email: "",
                tenure: "",
                role: "",
                level: "",
            })
            onOpenChange(false)
        }
    }

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add New Employee</DialogTitle>
                    <DialogDescription>
                        Add a new employee for exit interview session.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="employeeName">Employee Name</Label>
                        <Input
                            id="employeeName"
                            value={formData.employeeName}
                            onChange={(e) => handleInputChange("employeeName", e.target.value)}
                            placeholder="Enter employee name"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            placeholder="Enter email address"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {employeeRoles.map((role) => (
                                        <SelectItem key={role.id} value={role.id}>
                                            {role.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="level">Level</Label>
                            <Select value={formData.level} onValueChange={(value) => handleInputChange("level", value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                                <SelectContent>
                                    {employeeLevels.map((level) => (
                                        <SelectItem key={level.id} value={level.id}>
                                            {level.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="tenure">Tenure (months)</Label>
                            <Input
                                id="tenure"
                                type="number"
                                min="1"
                                value={formData.tenure}
                                onChange={(e) => handleInputChange("tenure", e.target.value)}
                                placeholder="e.g., 24 months"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit">
                            Add Employee
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
