import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Container, Row, Col, Form, Button, Card } from 'react-bootstrap'
import { IconArrowLeft, IconDeviceFloppy } from '@tabler/icons-react'
import axiosInstance from '../../../api/axiosInstance'
import { useDialog } from '../../../hooks/useDialog'
import { DIALOG_MESSAGES } from '../../../utils/dialogMessages'

export default function ServiceFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showSuccess, showError } = useDialog()
  const isEdit = !!id

  const [formData, setFormData] = useState({
    title_en: '',
    title_bn: '',
    description_en: '',
    description_bn: '',
    icon: 'IconStethoscope',
    image: '',
    is_active: true,
    sort_order: 0
  })

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isEdit) {
      const fetchService = async () => {
        try {
          const res = await axiosInstance.get(`/admin/services/${id}`)
          setFormData(res.data)
        } catch (err) {
          navigate('/admin/services')
        }
      }
      fetchService()
    }
  }, [id, isEdit, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEdit) {
        await axiosInstance.put(`/admin/services/${id}`, formData)
        showSuccess({
          title: DIALOG_MESSAGES.UPDATE_SUCCESS.title,
          message: 'সেবা তথ্য সফলভাবে হালনাগাদ করা হয়েছে।',
        })
      } else {
        await axiosInstance.post('/admin/services', formData)
        showSuccess({
          title: DIALOG_MESSAGES.SAVE_SUCCESS.title,
          message: 'নতুন সেবা সফলভাবে তৈরি করা হয়েছে।',
        })
      }
      setTimeout(() => navigate('/admin/services'), 700)
    } catch (err) {
      showError({
        title: DIALOG_MESSAGES.ERROR.title,
        message: 'সেবা তথ্য সংরক্ষণে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">{isEdit ? 'Edit Service' : 'Create New Service'}</h2>
          <p className="admin-page-subtitle">Configure healthcare service details and appearance</p>
        </div>
        <Button variant="light" onClick={() => navigate('/admin/services')} className="d-flex align-items-center gap-2">
          <IconArrowLeft size={18} /> Back to List
        </Button>
      </div>

      <Form onSubmit={handleSubmit}>
        <Row>
          <Col lg={8}>
            <Card className="admin-card mb-4">
              <Card.Body className="p-4">
                <h5 className="mb-4">Content (English)</h5>
                <Form.Group className="mb-3">
                  <Form.Label>Service Title (EN)</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={formData.title_en} 
                    onChange={e => setFormData({...formData, title_en: e.target.value})}
                    required
                    placeholder="e.g. General Consultation"
                  />
                </Form.Group>
                <Form.Group className="mb-4">
                  <Form.Label>Description (EN)</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={4} 
                    value={formData.description_en} 
                    onChange={e => setFormData({...formData, description_en: e.target.value})}
                    placeholder="Briefly describe the service..."
                  />
                </Form.Group>

                <hr className="my-5" />

                <h5 className="mb-4">Content (Bangla)</h5>
                <Form.Group className="mb-3">
                  <Form.Label>Service Title (BN)</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={formData.title_bn} 
                    onChange={e => setFormData({...formData, title_bn: e.target.value})}
                    required
                    placeholder="যেমন: সাধারণ চিকিৎসা পরামর্শ"
                  />
                </Form.Group>
                <Form.Group className="mb-0">
                  <Form.Label>Description (BN)</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={4} 
                    value={formData.description_bn} 
                    onChange={e => setFormData({...formData, description_bn: e.target.value})}
                    placeholder="সেবাটি সম্পর্কে সংক্ষেপে লিখুন..."
                  />
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="admin-card mb-4">
              <Card.Body className="p-4">
                <h5 className="mb-4">Appearance & Status</h5>
                
                <Form.Group className="mb-3">
                  <Form.Label>Icon (Class or Name)</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={formData.icon} 
                    onChange={e => setFormData({...formData, icon: e.target.value})}
                    placeholder="e.g. IconStethoscope"
                  />
                  <Form.Text className="text-muted">Supports Tabler Icons or FontAwesome</Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Image URL (Optional)</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={formData.image} 
                    onChange={e => setFormData({...formData, image: e.target.value})}
                    placeholder="https://..."
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Sort Order</Form.Label>
                  <Form.Control 
                    type="number" 
                    value={formData.sort_order} 
                    onChange={e => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})}
                  />
                </Form.Group>

                <Form.Check 
                  type="switch"
                  label="Is Active"
                  checked={formData.is_active}
                  onChange={e => setFormData({...formData, is_active: e.target.checked})}
                  className="mb-4"
                />

                <Button type="submit" className="btn-admin-primary w-100 py-3 d-flex align-items-center justify-content-center gap-2" disabled={loading}>
                  <IconDeviceFloppy size={20} /> {loading ? 'Saving...' : 'Save Service'}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  )
}
