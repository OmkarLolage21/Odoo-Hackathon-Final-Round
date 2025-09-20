import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  CubeIcon,
  DocumentTextIcon,
  BanknotesIcon,
  ShoppingCartIcon,
  DocumentDuplicateIcon,
  ChartBarIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon, roles: ['admin', 'invoicing_user'] },
  { name: 'Users', href: '/users', icon: UsersIcon, roles: ['admin'] },
  { 
    name: 'Master Data', 
    icon: CogIcon,
    roles: ['admin', 'invoicing_user'],
    children: [
      { name: 'Contacts', href: '/contacts', icon: UsersIcon },
      { name: 'Products', href: '/products', icon: CubeIcon },
      { name: 'Taxes', href: '/taxes', icon: DocumentTextIcon },
      { name: 'Chart of Accounts', href: '/chart-of-accounts', icon: BanknotesIcon },
    ]
  },
  {
    name: 'Purchases',
    icon: ShoppingCartIcon,
    roles: ['admin', 'invoicing_user'],
    children: [
      { name: 'Purchase Orders', href: '/purchase-orders', icon: DocumentDuplicateIcon },
      { name: 'Vendor Bills', href: '/vendor-bills', icon: DocumentTextIcon },
    ]
  },
  {
    name: 'Sales',
    icon: BanknotesIcon,
    roles: ['admin', 'invoicing_user'],
    children: [
      { name: 'Sales Orders', href: '/sales-orders', icon: DocumentDuplicateIcon },
      { name: 'Customer Invoices', href: '/customer-invoices', icon: DocumentTextIcon },
    ]
  },
  { name: 'Payments', href: '/payments', icon: BanknotesIcon, roles: ['admin', 'invoicing_user'] },
  {
    name: 'Reports',
    icon: ChartBarIcon,
    roles: ['admin', 'invoicing_user'],
    children: [
      { name: 'Balance Sheet', href: '/reports/balance-sheet', icon: ChartBarIcon },
      { name: 'Profit & Loss', href: '/reports/profit-loss', icon: ChartBarIcon },
      { name: 'Stock Report', href: '/reports/stock', icon: ChartBarIcon },
    ]
  },
  { name: 'My Invoices', href: '/my-invoices', icon: DocumentTextIcon, roles: ['contact'] },
  { name: 'Sessions', href: '/account/sessions', icon: CogIcon, roles: ['admin', 'invoicing_user', 'contact'] },
  { name: 'Change Password', href: '/account/change-password', icon: CogIcon, roles: ['admin', 'invoicing_user', 'contact'] },
];

export default function Sidebar() {
  const { user } = useAuth();
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

  const toggleExpanded = (name: string) => {
    setExpandedItems(prev => 
      prev.includes(name) 
        ? prev.filter(item => item !== name)
        : [...prev, name]
    );
  };

  const filteredNavigation = navigation.filter(item => 
    !item.roles || item.roles.includes(user?.role || '')
  );

  return (
    <div className="flex flex-col w-64 bg-white shadow-sm border-r border-gray-200">
      <div className="flex items-center justify-center h-16 px-4 bg-gradient-to-r from-brand-600 to-brand-500">
        <h1 className="text-xl font-bold text-white">Shiv Accounts</h1>
      </div>
      
      <nav className="flex-1 px-2 py-4 space-y-1">
        {filteredNavigation.map((item) => (
          <div key={item.name}>
            {item.children ? (
              <>
                <button
                  onClick={() => toggleExpanded(item.name)}
                  className="flex items-center justify-between w-full px-2 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  <div className="flex items-center">
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </div>
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      expandedItems.includes(item.name) ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedItems.includes(item.name) && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.name}
                        to={child.href}
                        className={({ isActive }) =>
                          `flex items-center px-2 py-2 text-sm font-medium rounded-lg transition-colors ${
                            isActive
                              ? 'bg-brand-100 text-brand-900'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`
                        }
                      >
                        <child.icon className="w-4 h-4 mr-3" />
                        {child.name}
                      </NavLink>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center px-2 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-purple-100 text-purple-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </NavLink>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}