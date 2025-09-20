import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import LoginForm from './components/Auth/LoginForm';
import SignUp from './pages/Auth/SignUp';
import Dashboard from './pages/Dashboard';
import UserList from './pages/Users/UserList';
import CreateUser from './pages/Users/CreateUser';
import ContactList from './pages/Contacts/ContactList';
import ContactForm from './pages/Contacts/ContactForm';
import ProductList from './pages/Products/ProductList';
import ProductForm from './pages/Products/ProductForm';
import TaxList from './pages/Taxes/TaxList';
import TaxForm from './pages/Taxes/TaxForm';
import ChartOfAccountsList from './pages/ChartOfAccounts/ChartOfAccountsList';
import ChartOfAccountsForm from './pages/ChartOfAccounts/ChartOfAccountsForm';
import BalanceSheet from './pages/Reports/BalanceSheet';
import Sessions from './pages/Auth/Sessions';
import ChangePassword from './pages/Auth/ChangePassword';
import PurchaseOrderList from './pages/Purchase/PurchaseOrderList';
import PurchaseOrderForm from './pages/Purchase/PurchaseOrderForm';
import VendorBillList from './pages/Purchase/VendorBillList';
import VendorBillForm from './pages/Purchase/VendorBillForm';
import BillPaymentForm from './pages/Purchase/BillPaymentForm';
import PaymentList from './pages/Purchase/PaymentList';
import SalesOrderList from './pages/Sales/SalesOrderList';
import SalesOrderForm from './pages/Sales/SalesOrderForm';
import CustomerInvoiceList from './pages/Sales/CustomerInvoiceList';
import CustomerInvoiceForm from './pages/Sales/CustomerInvoiceForm';
import ReceiptForm from './pages/Sales/ReceiptForm';
import ProfitLoss from './pages/Reports/ProfitLoss';
import StockReport from './pages/Reports/StockReport';
import PartnerLedger from './pages/Reports/PartnerLedger';
// import MyInvoices from './pages/Portal/MyInvoices';
// import Payments from './pages/Payments/Payments';
import AuthStatusBanner from './components/Auth/AuthStatusBanner';
import { PurchaseProvider } from './contexts/PurchaseContext';
// import MyInvoices from './pages/Portal/MyInvoices';
// import Payments from './pages/Payments/Payments';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

function AppContent() {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <LoginForm />} />
        <Route path="/signup" element={user ? <Navigate to="/" /> : <SignUp />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Routes>
                  <Route element={<Layout />}> 
                    <Route index element={<Dashboard />} />
                    <Route path="users" element={<UserList />} />
                    <Route path="users/new" element={<CreateUser />} />
                    <Route path="users/:id/edit" element={<CreateUser />} />
                    <Route path="contacts" element={<ContactList />} />
                    <Route path="contacts/new" element={<ContactForm />} />
                    <Route path="contacts/:id/edit" element={<ContactForm />} />
                    <Route path="products" element={<ProductList />} />
                    <Route path="products/new" element={<ProductForm />} />
                    <Route path="products/:id/edit" element={<ProductForm />} />
                    <Route path="taxes" element={<TaxList />} />
                    <Route path="taxes/new" element={<TaxForm />} />
                    <Route path="taxes/:id/edit" element={<TaxForm />} />
                    <Route path="chart-of-accounts" element={<ChartOfAccountsList />} />
                    <Route path="chart-of-accounts/new" element={<ChartOfAccountsForm />} />
                    <Route path="chart-of-accounts/:id/edit" element={<ChartOfAccountsForm />} />
                    {/* Purchase */}
                    <Route path="purchase-orders" element={<PurchaseOrderList />} />
                    <Route path="purchase-orders/new" element={<PurchaseOrderForm />} />
                    <Route path="purchase-orders/:id/edit" element={<PurchaseOrderForm />} />
                    <Route path="vendor-bills" element={<VendorBillList />} />
                    <Route path="vendor-bills/new" element={<VendorBillForm />} />
                    <Route path="vendor-bills/:id/edit" element={<VendorBillForm />} />
                    <Route path="vendor-bills/:id/pay" element={<BillPaymentForm />} />
                    <Route path="payments" element={<PaymentList />} />
                    <Route path="payments/:paymentId" element={<BillPaymentForm />} />
                    {/* Sales */}
                    <Route path="sales-orders" element={<SalesOrderList />} />
                    <Route path="sales-orders/new" element={<SalesOrderForm />} />
                    <Route path="sales-orders/:id/edit" element={<SalesOrderForm />} />
                    <Route path="customer-invoices" element={<CustomerInvoiceList />} />
                    <Route path="customer-invoices/new" element={<CustomerInvoiceForm />} />
                    <Route path="customer-invoices/:id/edit" element={<CustomerInvoiceForm />} />
                    <Route path="receipts/new" element={<ReceiptForm />} />
                    {/* Reports */}
                    <Route path="reports/balance-sheet" element={<BalanceSheet />} />
                    <Route path="reports/profit-loss" element={<ProfitLoss />} />
                    <Route path="reports/stock" element={<StockReport />} />
                    <Route path="reports/partner-ledger" element={<PartnerLedger />} />
                    {/* Account / Security */}
                    <Route path="account/sessions" element={<Sessions />} />
                    <Route path="account/change-password" element={<ChangePassword />} />
                    {/* Payments & Portal */}
                    {/* <Route path="payments" element={<Payments />} /> */}
                    {/* <Route path="my-invoices" element={<MyInvoices />} /> */}
                    {/* Fallback */}
                    <Route path="*" element={
                      <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Not Found</h2>
                          <p className="text-gray-600">The page you requested does not exist.</p>
                        </div>
                      </div>
                    } />
                  </Route>
              </Routes>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthStatusBanner />
      <PurchaseProvider>
        <AppContent />
      </PurchaseProvider>
    </AuthProvider>
  );
}

export default App;