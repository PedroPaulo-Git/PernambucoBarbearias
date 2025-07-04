"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Clock, MapPin, Users, Loader2 } from "lucide-react"
import { GET } from '@/app/api/user/subscribe/route'
import Link from "next/link"
import { hasActiveSubscription } from "@/lib/subscriptionUtils"
import { ImageUploader } from "@/components/ImageUploader"
import { Textarea } from "@/components/ui/textarea"

interface Shop {
  id: string
  name: string
  slug: string
  address?: string
  openTime: string
  closeTime: string
  serviceDuration: number
  _count: {
    appointments: number
  }
}

export default function DashboardPage() {
  const { status } = useSession()
  const router = useRouter()
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    openTime: "09:00",
    closeTime: "18:00",
    serviceDuration: 60,
    description: "",
    instagramUrl: "",
    whatsappNumber: "",
    mapUrl: "",
  })
  const [gallery, setGallery] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [plan, setPlan] = useState<any>(null);
  const [hasActiveSub, setHasActiveSub] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeMsg, setRemoveMsg] = useState("");

  const fetchShops = async () => {
    try {
      const response = await fetch("/api/shops")
      const data = await response.json()

      if (response.ok) {
        setShops(data)
      }
    } catch (error) {
      console.error("Erro ao buscar shops:", error)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    console.log("plan", plan)
    // console.log("plan.plan.shopLimit", plan?.plan.shopLimit)
  }, [plan])

  useEffect(() => {
    fetchShops()
    // Buscar plano do usuário pela NOVA rota
    fetch("/api/user/subscribe").then(res => res.json()).then(data => {
      // A API pode retornar a assinatura diretamente ou dentro de um objeto
      const subscription = data.subscription || data;
      console.log('subscription ->', subscription)
      setPlan(subscription);
      if (subscription && subscription.status) {
        const now = new Date();
        const isActive = subscription.status === 'active' && subscription.paymentEnd && new Date(subscription.paymentEnd) > now;
        console.log('isActive ->', isActive)
        setHasActiveSub(isActive);
      } else {
        setHasActiveSub(false);
      }
    })
    console.log('plan ->', plan)
    console.log('hasActiveSub ->', hasActiveSub)
    console.log('shops ->', shops)
    console.log('status ->', status)
  
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { whatsappNumber, ...rest } = formData;
      const fullData = {
        ...rest,
        galleryImages: gallery,
        whatsappUrl: whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}` : undefined,
      };

      const response = await fetch("/api/shops", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fullData),
      })

      if (response.ok) {
        setFormData({
          name: "",
          address: "",
          openTime: "09:00",
          closeTime: "18:00",
          serviceDuration: 60,
          description: "",
          instagramUrl: "",
          whatsappNumber: "",
          mapUrl: "",
        })
        setGallery([]);
        setShowForm(false)
        fetchShops()
      }
    } catch (error) {
      console.error("Erro ao criar shop:", error)
    } finally {
      setSubmitting(false)
    }
  }

  // Redirecionar se não estiver logado
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin")
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Gerencie suas barbearias e sua assinatura.
            </p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            disabled={
              !plan ||
              plan.status !== 'active' ||
              (plan.shopLimit && shops.length >= plan.shopLimit)
            }
            className="mt-4 md:mt-0"
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Barbearia
          </Button>
        </div>

        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Seu Plano</CardTitle>
            </CardHeader>
            <CardContent>
              {!plan ? (
                 <div className="flex items-center justify-between">
                    <p className="font-medium">Carregando informações do plano...</p>
                 </div>
              ) : hasActiveSub ? (
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-lg">
                        {plan.name}{" "}
                        <span className="text-sm font-normal px-2 py-1 rounded-full bg-green-200 text-green-800">
                          Ativo
                        </span>
                      </p>
                      {plan.paymentEnd && (
                        <p className="text-sm text-muted-foreground">
                          Acesso até:{" "}
                          {new Date(plan.paymentEnd).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        Limite de barbearias: {shops.length} / {plan.shopLimit}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" asChild className="mt-4 md:mt-0 self-start md:self-center">
                      <Link href="/plans">Gerenciar Plano</Link>
                    </Button>
                  </div>
              ) : (
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
                    <div>
                      <p className="font-medium">Sua assinatura não está ativa.</p>
                      {plan.status === 'unpaid' && <p className="text-sm text-yellow-600">Seu pagamento está pendente. Verifique seu e-mail ou finalize a compra.</p>}
                      {plan.status === 'expired' && <p className="text-sm text-red-600">Sua assinatura expirou.</p>}
                      <p className="text-sm text-muted-foreground mt-1">Assine ou reative seu plano para gerenciar suas barbearias.</p>
                    </div>
                    <Button size="sm" asChild className="mt-4 md:mt-0 self-start md:self-center">
                      <Link href="/plans">Ver Planos</Link>
                    </Button>
                  </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Formulário de nova barbearia só aparece se permitido pelo plano */}
        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Nova Barbearia</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Barbearia</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Ex: Barbearia do João"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço (opcional)</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="Rua, número, bairro"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="openTime">Horário de Abertura</Label>
                    <Input
                      id="openTime"
                      type="time"
                      value={formData.openTime}
                      onChange={(e) => setFormData({...formData, openTime: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="closeTime">Horário de Fechamento</Label>
                    <Input
                      id="closeTime"
                      type="time"
                      value={formData.closeTime}
                      onChange={(e) => setFormData({...formData, closeTime: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="serviceDuration">Duração do Serviço (minutos)</Label>
                    <Input
                      id="serviceDuration"
                      type="number"
                      value={formData.serviceDuration}
                      onChange={(e) => setFormData({...formData, serviceDuration: parseInt(e.target.value)})}
                      min="15"
                      max="180"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (Opcional)</Label>
                  <Textarea id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Fale sobre sua barbearia..." />
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="instagramUrl">Instagram (Opcional)</Label>
                    <Input id="instagramUrl" value={formData.instagramUrl} onChange={(e) => setFormData({...formData, instagramUrl: e.target.value})} placeholder="https://instagram.com/..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsappNumber">WhatsApp (Apenas Números)</Label>
                    <Input id="whatsappNumber" value={formData.whatsappNumber} onChange={(e) => setFormData({...formData, whatsappNumber: e.target.value})} placeholder="5511999998888" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mapUrl">Link do Google Maps (Opcional)</Label>
                  <Input id="mapUrl" value={formData.mapUrl} onChange={(e) => setFormData({...formData, mapUrl: e.target.value})} placeholder="https://maps.app.goo.gl/..." />
                </div>

                <div className="space-y-2">
                  <Label>Galeria de Fotos (Opcional, até 3)</Label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                      {gallery.map((url, i) => (
                        <div key={i} className="relative">
                          <img src={url} alt={`Foto ${i + 1}`} className="rounded-md object-cover h-24 w-full" />
                          <button type="button" onClick={() => setGallery(gallery.filter(g => g !== url))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs">&times;</button>
                        </div>
                      ))}
                  </div>
                  {gallery.length < 3 && (
                    <ImageUploader
                      onUploadComplete={(res) => setGallery([...gallery, ...res.map(r => r.url)])}
                      onUploadError={(err) => console.error("Upload Error:", err)}
                    />
                  )}
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Criando..." : "Criar Barbearia"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowForm(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : shops.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              {!plan ? (
                <p>Verificando seu plano...</p>
              ) : hasActiveSub ? (
                <>
                  <p className="text-muted-foreground mb-4">
                    Você já tem um plano! Adicione sua primeira barbearia para começar.
                  </p>
                  <Button onClick={() => setShowForm(true)}>
                    Adicionar Barbearia
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground mb-4">
                    Sua jornada começa com um plano. Assine para cadastrar sua barbearia e ter acesso ao seu link de agendamento, painel de controle e todas as ferramentas de crescimento.
                  </p>
                  <div className="flex justify-center gap-2 md:flex-row flex-col">
                    <Button asChild>
                      <Link href="/plans">Ver Planos</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/#features">Conhecer Funcionalidades</Link>
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop) => (
              <Card key={shop.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{shop.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {shop._count.appointments} agendamentos ativos
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {shop.address && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{shop.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{shop.openTime} - {shop.closeTime}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{shop.serviceDuration} min por serviço</span>
                  </div>
                  <div className="pt-2">
                    <Button 
                      variant="outline" 
                      className="w-full mb-2"
                      onClick={() => window.open(`/shops/${shop.slug}`, '_blank')}
                    >
                      Ver Página Pública
                    </Button>
                    <Button 
                      className="w-full"
                      onClick={() => router.push(`/dashboard/manage/${shop.slug}`)}
                    >
                      Gerenciar Barbearia
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 