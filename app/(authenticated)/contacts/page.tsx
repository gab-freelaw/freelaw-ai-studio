'use client'

import { AppLayout } from '@/components/layouts/app-layout'

import { useState, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  Plus, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  Building, 
  Briefcase,
  UserCheck,
  Users,
  Edit,
  Trash2,
  MoreVertical,
  Download,
  Upload
} from 'lucide-react'
import { Contact, ContactFormData } from '@/lib/types/contact'
import { ContactFormModal } from '@/components/contacts/contact-form-modal'
import { toast } from 'sonner'

const TIPO_BADGES = {
  CLIENTE: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: UserCheck },
  PARTE_CONTRARIA: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: Users },
  ADVOGADO: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', icon: Briefcase },
  PERITO: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: User },
  TESTEMUNHA: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: User },
  OUTRO: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200', icon: User }
}

function ContactsContent() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTipo, setFilterTipo] = useState<string>('TODOS')
  const [showModal, setShowModal] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])

  // Load contacts from API
  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    try {
      const response = await fetch('/api/contacts')
      if (!response.ok) throw new Error('Failed to load contacts')
      const data = await response.json()
      setContacts(data)
    } catch (error) {
      console.error('Error loading contacts:', error)
      toast.error('Erro ao carregar contatos')
    }
  }

  const handleAddContact = () => {
    setEditingContact(null)
    setShowModal(true)
  }

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact)
    setShowModal(true)
  }

  const handleDeleteContact = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este contato?')) {
      try {
        const response = await fetch(`/api/contacts/${id}`, {
          method: 'DELETE'
        })
        if (!response.ok) throw new Error('Failed to delete contact')
        
        setContacts(prev => prev.filter(c => c.id !== id))
        toast.success('Contato excluído com sucesso')
      } catch (error) {
        console.error('Error deleting contact:', error)
        toast.error('Erro ao excluir contato')
      }
    }
  }

  const handleSubmitContact = async (data: ContactFormData) => {
    try {
      const url = editingContact 
        ? `/api/contacts/${editingContact.id}`
        : '/api/contacts'
      
      const method = editingContact ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) throw new Error('Failed to save contact')
      
      const savedContact = await response.json()
      
      if (editingContact) {
        setContacts(prev => prev.map(c => 
          c.id === savedContact.id ? savedContact : c
        ))
        toast.success('Contato atualizado com sucesso')
      } else {
        setContacts(prev => [savedContact, ...prev])
        toast.success('Contato adicionado com sucesso')
      }
      
      setShowModal(false)
      setEditingContact(null)
    } catch (error) {
      console.error('Error saving contact:', error)
      toast.error('Erro ao salvar contato')
    }
  }

  const handleExportContacts = () => {
    const dataStr = JSON.stringify(filteredContacts, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = `contatos_${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
    
    toast.success('Contatos exportados com sucesso')
  }

  const handleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([])
    } else {
      setSelectedContacts(filteredContacts.map(c => c.id))
    }
  }

  const filteredContacts = contacts.filter(contact => {
    const matchTipo = filterTipo === 'TODOS' || contact.tipo === filterTipo
    const matchSearch = !searchQuery || 
      contact.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.cpf_cnpj?.includes(searchQuery) ||
      contact.oab?.includes(searchQuery)
    
    return matchTipo && matchSearch
  })

  const stats = {
    total: contacts.length,
    clientes: contacts.filter(c => c.tipo === 'CLIENTE').length,
    advogados: contacts.filter(c => c.tipo === 'ADVOGADO').length,
    partes: contacts.filter(c => c.tipo === 'PARTE_CONTRARIA').length
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Contatos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie seus contatos, clientes e partes relacionadas
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total de Contatos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Clientes</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.clientes}</p>
              </div>
              <UserCheck className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Advogados</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.advogados}</p>
              </div>
              <Briefcase className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Partes Contrárias</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.partes}</p>
              </div>
              <Users className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Procure por nome, email, CPF/CNPJ ou OAB..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="TODOS">Todos os tipos</option>
              <option value="CLIENTE">Clientes</option>
              <option value="ADVOGADO">Advogados</option>
              <option value="PARTE_CONTRARIA">Partes Contrárias</option>
              <option value="PERITO">Peritos</option>
              <option value="TESTEMUNHA">Testemunhas</option>
              <option value="OUTRO">Outros</option>
            </select>

            <button
              onClick={handleExportContacts}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>

            <button
              onClick={handleAddContact}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </button>
          </div>

          {selectedContacts.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedContacts.length} contato(s) selecionado(s)
              </p>
            </div>
          )}
        </div>

        {/* Contacts List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Documento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredContacts.map((contact) => {
                  const TipoBadge = TIPO_BADGES[contact.tipo]
                  const Icon = TipoBadge.icon
                  
                  return (
                    <tr key={contact.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedContacts.includes(contact.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedContacts([...selectedContacts, contact.id])
                            } else {
                              setSelectedContacts(selectedContacts.filter(id => id !== contact.id))
                            }
                          }}
                          className="rounded border-gray-300 dark:border-gray-600"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${TipoBadge.color}`}>
                          <Icon className="w-3 h-3" />
                          {contact.tipo.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {contact.nome}
                          </p>
                          {contact.tags && contact.tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {contact.tags.map(tag => (
                                <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {contact.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <Mail className="w-4 h-4" />
                              {contact.email}
                            </div>
                          )}
                          {contact.celular && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <Phone className="w-4 h-4" />
                              {contact.celular}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {contact.cpf_cnpj || contact.oab || '-'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditContact(contact)}
                            className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteContact(contact.id)}
                            className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filteredContacts.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Nenhum contato encontrado
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Contact Form Modal */}
      <ContactFormModal
        open={showModal}
        onOpenChange={setShowModal}
        contact={editingContact || undefined}
        onSubmit={handleSubmitContact}
      />
    </div>
  )
}

export default function ContactsPage() {
  return (
    <AppLayout>
      <ContactsContent />
    </AppLayout>
  )
}