import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Container, Table, Button, Badge, Modal } from 'react-bootstrap'
import { IconPlus, IconEdit, IconTrash, IconEye } from '@tabler/icons-react'
import axiosInstance from '../../../api/axiosInstance'
import { toast } from 'react-hot-toast'

export default function ServiceListPage() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDelete, setShowDelete] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const fetchServices = async () => {
    setLoading(true)
    try {
      const res = await axiosInstance.get('/admin/services')
      setServices(res.data)
    } catch (err) {
      
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/admin/services/\${deletingId}`)
      
      fetchServices()
      setShowDelete(false)
    } catch (err) {
      
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Services Management</h2>
          <p className="admin-page-subtitle">Manage healthcare services shown on the website</p>
        </div>
        <Button as={Link} to="/admin/services/create" className="btn-admin-primary">
          <IconPlus size={18} /> Add Service
        </Button>
      </div>

      <div className="admin-card">
        <Table responsive hover className="admin-table">
          <thead>
            <tr>
              <th>Icon</th>
              <th>Title (EN)</th>
              <th>Title (BN)</th>
              <th>Status</th>
              <th>Sort</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center py-5">Loading services...</td></tr>
            ) : services.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-5">No services found</td></tr>
            ) : services.map(service => (
              <tr key={service.id}>
                <td>
                  <div className="service-icon-preview">
                    {service.icon?.startsWith('http') ? <img src={service.icon} alt="" width="30" /> : <i className={service.icon}></i>}
                  </div>
                </td>
                <td><strong>{service.title_en}</strong></td>
                <td>{service.title_bn}</td>
                <td>
                  <Badge bg={service.is_active ? 'success' : 'secondary'}>
                    {service.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td>{service.sort_order}</td>
                <td>
                  <div className="d-flex gap-2">
                    <Button variant="light" size="sm" as={Link} to={`/admin/services/edit/\${service.id}`}>
                      <IconEdit size={16} />
                    </Button>
                    <Button variant="light" size="sm" className="text-danger" onClick={() => { setDeletingId(service.id); setShowDelete(true); }}>
                      <IconTrash size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <Modal show={showDelete} onHide={() => setShowDelete(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this service? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDelete(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete Service</Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .service-icon-preview {
          width: 40px;
          height: 40px;
          background: var(--admin-bg);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: var(--admin-primary);
        }
      `}</style>
    </div>
  )
}
