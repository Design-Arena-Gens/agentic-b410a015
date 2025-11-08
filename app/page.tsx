"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Plus,
  FileText,
  Download,
  BarChart3,
} from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";

interface Worker {
  id: string;
  name: string;
  role: "contractor" | "labour";
  dailyRate: number;
  phone: string;
}

interface Attendance {
  workerId: string;
  date: string;
  status: "present" | "absent" | "half-day";
  hours: number;
  notes: string;
}

export default function Home() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [activeTab, setActiveTab] = useState<"attendance" | "workers" | "reports">("attendance");

  // Load data from localStorage
  useEffect(() => {
    const savedWorkers = localStorage.getItem("workers");
    const savedAttendance = localStorage.getItem("attendance");

    if (savedWorkers) setWorkers(JSON.parse(savedWorkers));
    if (savedAttendance) setAttendance(JSON.parse(savedAttendance));
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem("workers", JSON.stringify(workers));
  }, [workers]);

  useEffect(() => {
    localStorage.setItem("attendance", JSON.stringify(attendance));
  }, [attendance]);

  const addWorker = (worker: Omit<Worker, "id">) => {
    const newWorker = { ...worker, id: Date.now().toString() };
    setWorkers([...workers, newWorker]);
    setShowAddWorker(false);
  };

  const removeWorker = (id: string) => {
    setWorkers(workers.filter((w) => w.id !== id));
    setAttendance(attendance.filter((a) => a.workerId !== id));
  };

  const markAttendance = (
    workerId: string,
    status: "present" | "absent" | "half-day",
    hours: number
  ) => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const existing = attendance.find(
      (a) => a.workerId === workerId && a.date === dateStr
    );

    if (existing) {
      setAttendance(
        attendance.map((a) =>
          a.workerId === workerId && a.date === dateStr
            ? { ...a, status, hours }
            : a
        )
      );
    } else {
      setAttendance([
        ...attendance,
        { workerId, date: dateStr, status, hours, notes: "" },
      ]);
    }
  };

  const getAttendanceForDate = (workerId: string, date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return attendance.find((a) => a.workerId === workerId && a.date === dateStr);
  };

  const calculateWeeklyStats = (workerId: string) => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    let presentDays = 0;
    let totalHours = 0;
    let totalPay = 0;

    const worker = workers.find((w) => w.id === workerId);
    if (!worker) return { presentDays, totalHours, totalPay };

    weekDays.forEach((day) => {
      const att = getAttendanceForDate(workerId, day);
      if (att) {
        if (att.status === "present") presentDays += 1;
        if (att.status === "half-day") presentDays += 0.5;
        totalHours += att.hours;
      }
    });

    totalPay = presentDays * worker.dailyRate;

    return { presentDays, totalHours, totalPay };
  };

  const getTotalPayments = () => {
    return workers.reduce((total, worker) => {
      return total + calculateWeeklyStats(worker.id).totalPay;
    }, 0);
  };

  const exportReport = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });

    let report = `Plumber Contractor Report\n`;
    report += `Week: ${format(weekStart, "MMM dd")} - ${format(weekEnd, "MMM dd, yyyy")}\n\n`;
    report += `${"=".repeat(80)}\n\n`;

    workers.forEach((worker) => {
      const stats = calculateWeeklyStats(worker.id);
      report += `${worker.name} (${worker.role.toUpperCase()})\n`;
      report += `Phone: ${worker.phone}\n`;
      report += `Daily Rate: $${worker.dailyRate}\n`;
      report += `Days Present: ${stats.presentDays}\n`;
      report += `Total Hours: ${stats.totalHours}\n`;
      report += `Total Payment: $${stats.totalPay.toFixed(2)}\n`;
      report += `${"-".repeat(80)}\n`;
    });

    report += `\nTOTAL PAYMENTS: $${getTotalPayments().toFixed(2)}\n`;

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contractor-report-${format(selectedDate, "yyyy-MM-dd")}.txt`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-3 rounded-lg">
                <Users className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Plumber Contractor Manager
                </h1>
                <p className="text-gray-600">Track attendance & calculate payments</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Weekly Total</p>
              <p className="text-2xl font-bold text-green-600">
                ${getTotalPayments().toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <div className="bg-white rounded-lg shadow-sm p-1 flex gap-1">
          <button
            onClick={() => setActiveTab("attendance")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-all ${
              activeTab === "attendance"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Calendar size={20} />
            <span className="font-medium">Attendance</span>
          </button>
          <button
            onClick={() => setActiveTab("workers")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-all ${
              activeTab === "workers"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Users size={20} />
            <span className="font-medium">Workers</span>
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-all ${
              activeTab === "reports"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <BarChart3 size={20} />
            <span className="font-medium">Reports</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Attendance Tab */}
        {activeTab === "attendance" && (
          <div className="space-y-6">
            {/* Date Selector */}
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Date
                  </label>
                  <input
                    type="date"
                    value={format(selectedDate, "yyyy-MM-dd")}
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    className="input"
                  />
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Week Range</p>
                  <p className="font-semibold text-gray-900">
                    {format(startOfWeek(selectedDate, { weekStartsOn: 1 }), "MMM dd")} -{" "}
                    {format(endOfWeek(selectedDate, { weekStartsOn: 1 }), "MMM dd")}
                  </p>
                </div>
              </div>
            </div>

            {/* Attendance List */}
            {workers.length === 0 ? (
              <div className="card text-center py-12">
                <Users size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No Workers Added
                </h3>
                <p className="text-gray-600 mb-6">
                  Add contractors and labours to start tracking attendance
                </p>
                <button
                  onClick={() => {
                    setActiveTab("workers");
                    setShowAddWorker(true);
                  }}
                  className="btn btn-primary"
                >
                  <Plus size={20} className="inline mr-2" />
                  Add Worker
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {workers.map((worker) => {
                  const att = getAttendanceForDate(worker.id, selectedDate);
                  return (
                    <div key={worker.id} className="card">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {worker.name}
                          </h3>
                          <p className="text-gray-600">
                            {worker.role} • ${worker.dailyRate}/day
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Status</p>
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                              att?.status === "present"
                                ? "bg-green-100 text-green-800"
                                : att?.status === "half-day"
                                ? "bg-yellow-100 text-yellow-800"
                                : att?.status === "absent"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {att?.status === "present" && (
                              <CheckCircle size={16} />
                            )}
                            {att?.status === "absent" && <XCircle size={16} />}
                            {att?.status || "Not Marked"}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => markAttendance(worker.id, "present", 8)}
                          className={`flex-1 btn ${
                            att?.status === "present"
                              ? "btn-success"
                              : "btn-secondary"
                          }`}
                        >
                          <CheckCircle size={18} className="inline mr-2" />
                          Present (8h)
                        </button>
                        <button
                          onClick={() => markAttendance(worker.id, "half-day", 4)}
                          className={`flex-1 btn ${
                            att?.status === "half-day"
                              ? "bg-yellow-600 text-white hover:bg-yellow-700"
                              : "btn-secondary"
                          }`}
                        >
                          Half Day (4h)
                        </button>
                        <button
                          onClick={() => markAttendance(worker.id, "absent", 0)}
                          className={`flex-1 btn ${
                            att?.status === "absent"
                              ? "btn-danger"
                              : "btn-secondary"
                          }`}
                        >
                          <XCircle size={18} className="inline mr-2" />
                          Absent
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Workers Tab */}
        {activeTab === "workers" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Manage Workers
              </h2>
              <button
                onClick={() => setShowAddWorker(true)}
                className="btn btn-primary"
              >
                <Plus size={20} className="inline mr-2" />
                Add Worker
              </button>
            </div>

            {/* Add Worker Form */}
            {showAddWorker && (
              <div className="card bg-blue-50 border-blue-200">
                <h3 className="text-lg font-semibold mb-4">Add New Worker</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    addWorker({
                      name: formData.get("name") as string,
                      role: formData.get("role") as "contractor" | "labour",
                      dailyRate: parseFloat(formData.get("dailyRate") as string),
                      phone: formData.get("phone") as string,
                    });
                    e.currentTarget.reset();
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        className="input"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role
                      </label>
                      <select name="role" required className="input">
                        <option value="contractor">Contractor</option>
                        <option value="labour">Labour</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Daily Rate ($)
                      </label>
                      <input
                        type="number"
                        name="dailyRate"
                        required
                        min="0"
                        step="0.01"
                        className="input"
                        placeholder="150.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        className="input"
                        placeholder="+1234567890"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" className="btn btn-primary">
                      Add Worker
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddWorker(false)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Workers List */}
            <div className="space-y-4">
              {workers.map((worker) => (
                <div key={worker.id} className="card">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {worker.name}
                      </h3>
                      <p className="text-gray-600 mt-1">
                        <span className="font-medium capitalize">{worker.role}</span> •{" "}
                        ${worker.dailyRate}/day
                      </p>
                      <p className="text-gray-600">{worker.phone}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${worker.name}?`)) {
                          removeWorker(worker.id);
                        }
                      }}
                      className="btn btn-danger"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Weekly Report
              </h2>
              <button onClick={exportReport} className="btn btn-primary">
                <Download size={20} className="inline mr-2" />
                Export Report
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Total Workers</p>
                    <p className="text-4xl font-bold mt-2">{workers.length}</p>
                  </div>
                  <Users size={48} className="text-blue-200" />
                </div>
              </div>

              <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Total Payments</p>
                    <p className="text-4xl font-bold mt-2">
                      ${getTotalPayments().toFixed(0)}
                    </p>
                  </div>
                  <DollarSign size={48} className="text-green-200" />
                </div>
              </div>

              <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">Week Period</p>
                    <p className="text-lg font-bold mt-2">
                      {format(startOfWeek(selectedDate, { weekStartsOn: 1 }), "MMM dd")}
                      {" - "}
                      {format(endOfWeek(selectedDate, { weekStartsOn: 1 }), "MMM dd")}
                    </p>
                  </div>
                  <Calendar size={48} className="text-purple-200" />
                </div>
              </div>
            </div>

            {/* Detailed Report */}
            <div className="card">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <FileText size={24} />
                Detailed Breakdown
              </h3>
              <div className="space-y-4">
                {workers.map((worker) => {
                  const stats = calculateWeeklyStats(worker.id);
                  return (
                    <div
                      key={worker.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">
                            {worker.name}
                          </h4>
                          <p className="text-gray-600 capitalize">
                            {worker.role} • {worker.phone}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Total Payment</p>
                          <p className="text-2xl font-bold text-green-600">
                            ${stats.totalPay.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-200">
                        <div>
                          <p className="text-sm text-gray-600">Daily Rate</p>
                          <p className="text-lg font-semibold text-gray-900">
                            ${worker.dailyRate}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Days Present</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {stats.presentDays}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Hours</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {stats.totalHours}h
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {workers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 size={48} className="mx-auto mb-3 text-gray-400" />
                  <p>No workers to generate report</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
