import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getCreatorPayments } from "@/lib/creator-service";

interface Payment {
  id: string;
  milestone?: { title: string };
  project?: { title: string };
  amount: number;
  status: "pending" | "paid";
  due_date: string;
  paid_at?: string;
  created_at: string;
}

interface BankAccount {
  last4: string;
  type: string;
  holder: string;
}

export default function CreatorPayments() {
  const { user } = useAuth();
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user?.id) return;

      try {
        const paymentsData = await getCreatorPayments(user.id);
        setPayments(paymentsData || []);
      } catch (error) {
        console.error("Error fetching payments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [user?.id]);

  const displayPayments = payments.length > 0 ? payments : [];

  const bankAccount: BankAccount = {
    last4: "4242",
    type: "Checking",
    holder: user?.email || "Creator Account",
  };

  const stats = {
    totalEarned: displayPayments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + p.amount, 0),
    pending: displayPayments
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + p.amount, 0),
    processing: 0, // Supabase only has pending and paid
  };

  const statusColors: Record<string, string> = {
    pending: "bg-accent/20 text-accent",
    paid: "bg-secondary/20 text-secondary",
  };

  const statusIcons: Record<string, React.ReactNode> = {
    pending: <Clock className="h-5 w-5" />,
    paid: <CheckCircle className="h-5 w-5" />,
  };

  return (
    <DashboardLayout role="creator" userName={user?.email || "Creator"}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Payment History</h1>
          <p className="text-muted-foreground">Track your earnings and payouts</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Earned</p>
                  <p className="text-3xl font-bold">
                    ${stats.totalEarned.toLocaleString()}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-secondary" />
              </div>
              <p className="text-xs text-secondary font-medium mt-2">
                {displayPayments.filter((p) => p.status === "paid").length} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-3xl font-bold">
                    ${stats.processing.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-accent" />
              </div>
              <p className="text-xs text-accent font-medium mt-2">
                Approved deliverables
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Invoices</p>
                  <p className="text-3xl font-bold">
                    ${stats.pending.toLocaleString()}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-accent" />
              </div>
              <p className="text-xs text-accent font-medium mt-2">
                {displayPayments.filter((p) => p.status === "pending").length} awaiting approval
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Bank Account */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Payment Method</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowBankDetails(!showBankDetails)}
              >
                {showBankDetails ? "Hide" : "View"} Details
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showBankDetails ? (
              <div className="space-y-3 bg-muted p-4 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Account Holder</p>
                  <p className="font-semibold">{bankAccount.holder}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Account Type</p>
                  <p className="font-semibold">{bankAccount.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Account Ending In</p>
                  <p className="font-semibold">•••• {bankAccount.last4}</p>
                </div>
              </div>
            ) : (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-muted-foreground">
                  {bankAccount.type} account ending in •••• {bankAccount.last4}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading transactions...</p>
              </div>
            ) : displayPayments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No transactions yet. Complete deliverables to see payments here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                        Milestone
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                        Project
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                        Invoice Date
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                        Payment Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayPayments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-b border-border hover:bg-muted/30 transition"
                      >
                        <td className="py-4 px-4">
                          <span className="font-medium">
                            {payment.milestone?.title || "Unknown Milestone"}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {payment.project?.title || "Unknown Project"}
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-semibold">
                            ${payment.amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div
                              className={`text-lg ${
                                payment.status === "paid"
                                  ? "text-secondary"
                                  : "text-accent"
                              }`}
                            >
                              {statusIcons[payment.status]}
                            </div>
                            <span
                              className={`text-xs font-medium px-2 py-1 rounded ${
                                statusColors[payment.status]
                              }`}
                            >
                              {payment.status.charAt(0).toUpperCase() +
                                payment.status.slice(1)}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-muted-foreground">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 text-muted-foreground">
                          {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* FAQ / Info */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-1">How payments work</h4>
              <p className="text-sm text-muted-foreground">
                After you submit a deliverable, it moves to "Processing" when admin
                approves it. Payments are processed weekly on Fridays and arrive in
                2-3 business days.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Need to update bank details?</h4>
              <Button size="sm" variant="outline">
                Update Payment Method
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
