import { useMemo, useState, useEffect } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, Clock3, Flame, Instagram, Lock, MapPin, Menu as MenuIcon, Minus, Phone, Plus, Search, Settings2, ShoppingBag, Sparkles, Star, Upload, UtensilsCrossed, X } from 'lucide-react'
import './App.css'
import { supabase } from './lib/supabase'

type Dish = { id: string; name: string; description: string; price: number; category: string; time: string; image: string; best: boolean; available: boolean }
type CartLine = { dish: Dish; qty: number }
const initialDishes: Dish[] = []
const times = ['Menu Pagi', 'Menu Malam'];
const foodTypes = ['Makanan', 'Minuman', 'Camilan'];

// Jam buka - tutup per sesi (pagi & malam beda jamnya)
const HOURS = [
  { label: 'Pagi', open: '07.30', close: '13.30' },
  { label: 'Malam', open: '18.00', close: '22.00' },
]
const hoursLine = HOURS.map(h => `Sesi ${h.label.toLowerCase()} ${h.open}–${h.close}`).join(' · ')
const toMinutes = (t: string) => { const [h, m] = t.split('.').map(Number); return h * 60 + m }
const openStatus = () => {
  const now = new Date()
  const mins = now.getHours() * 60 + now.getMinutes()
  const live = HOURS.find(h => mins >= toMinutes(h.open) && mins < toMinutes(h.close))
  if (live) return { open: true, text: `Buka sekarang · sesi ${live.label.toLowerCase()} ${live.open}–${live.close}` }
  const next = HOURS.find(h => mins < toMinutes(h.open))
  return next
    ? { open: false, text: `Tutup · buka lagi ${next.open} (sesi ${next.label.toLowerCase()})` }
    : { open: false, text: `Tutup · buka lagi besok ${HOURS[0].open} (sesi pagi)` }
}

  // Daftar menu default (fallback bila Supabase tidak tersedia)
  const defaultDishes = [
    {
      id: '1',
      name: 'Nasi Goreng',
      description: 'Nasi goreng spesial dengan telur mata sapi',
      price: 25000,
      category: 'Makanan',
      time: 'Menu Pagi',
      image: '/images/nasi-goreng.jpg',
      best: false,
      available: true,
    },
    {
      id: '2',
      name: 'Ayam Lalapan',
      description: 'Ayam goreng renyah disajikan dengan lalapan segar',
      price: 30000,
      category: 'Makanan',
      time: 'Menu Malam',
      image: '/images/ayam-lalapan.jpg',
      best: false,
      available: true,
    },
    {
      id: '3',
      name: 'Puyuh Lalapan',
      description: 'Puyuh panggang dengan sambal lalapan',
      price: 35000,
      category: 'Makanan',
      time: 'Menu Malam',
      image: '/images/puyuh-lalapan.jpg',
      best: false,
      available: true,
    },
    {
      id: '4',
      name: 'Lele Lalapan',
      description: 'Lele goreng kriuk dengan lalapan segar',
      price: 28000,
      category: 'Makanan',
      time: 'Menu Malam',
      image: '/images/lele-lalapan.jpg',
      best: false,
      available: true,
    },
    {
      id: '5',
      name: 'Mie Goreng',
      description: 'Mie goreng spesial dengan sayuran dan telur',
      price: 22000,
      category: 'Makanan',
      time: 'Menu Pagi',
      image: '/images/mie-goreng.jpg',
      best: false,
      available: true,
    },
    // Minuman default
    {
      id: '6',
      name: 'Es Teh',
      description: 'Es teh manis segar',
      price: 8000,
      category: 'Minuman',
      time: 'Menu Pagi',
      image: '/images/es-teh.jpg',
      best: false,
      available: true,
    },
    {
      id: '7',
      name: 'Teh Hangat',
      description: 'Teh hangat dengan gula',
      price: 7000,
      category: 'Minuman',
      time: 'Menu Pagi',
      image: '/images/teh-hangat.jpg',
      best: false,
      available: true,
    },
    {
      id: '8',
      name: 'Nutrisari Jeruk',
      description: 'Minuman jus jeruk kemasan',
      price: 9000,
      category: 'Minuman',
      time: 'Menu Malam',
      image: '/images/nutrisari-jeruk.jpg',
      best: false,
      available: true,
    },
    {
      id: '9',
      name: 'Kopi',
      description: 'Kopi hitam panas',
      price: 12000,
      category: 'Minuman',
      time: 'Menu Pagi',
      image: '/images/kopi.jpg',
      best: false,
      available: true,
    },
    {
      id: '10',
      name: 'Joshua',
      description: 'Minuman energi Joshua',
      price: 15000,
      category: 'Minuman',
      time: 'Menu Malam',
      image: '/images/joshua.jpg',
      best: false,
      available: true,
    },
  ];
const money = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)

// Rating statis (sementara belum tersimpan di database / Supabase)
type Rating = { value: number; reviews: number }
const staticRating = (id: string): Rating => {
  let hash = 0
  for (const char of String(id)) hash = (hash * 31 + char.charCodeAt(0)) % 99991
  return { value: Number((4.4 + (hash % 7) / 10).toFixed(1)), reviews: 12 + (hash % 180) }
}
const ratingStars = (value: number) => Math.round(value)

function App() {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [time, setTime] = useState('Menu Pagi')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Dish | null>(null)
  const [modalQty, setModalQty] = useState(1)
  const [cart, setCart] = useState<CartLine[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [orderNote, setOrderNote] = useState('')
  const [sharedLoc, setSharedLoc] = useState<{ url: string; lat: number; lng: number; acc: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [admin, setAdmin] = useState(false)
  const [adminAuth, setAdminAuth] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminLoginError, setAdminLoginError] = useState('')
  const [editing, setEditing] = useState<Dish | null>(null)
  const [notice, setNotice] = useState('')
  const [mobileNav, setMobileNav] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [whatsappNumber, setWhatsappNumber] = useState('6281234567890')
  const [editingNumber, setEditingNumber] = useState(false)
  const [tempNumber, setTempNumber] = useState('6281234567890')
  const [uploading, setUploading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')

  useEffect(() => {
    loadDishes()
    loadSettings()
    const cleanup = setupRealtimeSubscription()
    return cleanup
  }, [])

  const loadDishes = async () => {
    const { data, error } = await supabase
      .from('dishes')
      .select('*')
      .eq('is_available', true)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error loading dishes:', error)
      // Fallback ke data default bila Supabase tidak dapat diakses
      setDishes(defaultDishes)
      return
    }
    
    // Jika tidak ada data atau tabel kosong, seed data default ke Supabase
    if (!data || data.length === 0) {
      await seedDefaultDishes();
      setDishes(defaultDishes)
      return
    }
    
    const formattedDishes = data.map(d => ({
      id: d.id,
      name: d.name,
      description: d.description,
      price: d.price,
      category: d.category === 'Menu Utama' ? 'Makanan' : d.category,
      time: d.time || 'Menu Pagi',
      image: d.image_url,
      best: d.is_bestseller,
      available: d.is_available
    }))
    
    setDishes(formattedDishes)
  }

  // Insert default dishes ke Supabase bila tabel masih kosong
  async function seedDefaultDishes() {
    try {
      const { error } = await supabase.from('dishes').insert(
        defaultDishes.map(d => ({
          name: d.name,
          description: d.description,
          price: d.price,
          category: d.category,
          time: d.time,
          image_url: d.image,
          is_bestseller: d.best,
          is_available: d.available,
        }))
      );
      if (error) throw error;
      console.log('Default dishes seeded');
      // Reload dishes after seeding
      loadDishes();
    } catch (e) {
      console.error('Error seeding default dishes:', e);
    }
  }

  const loadSettings = async () => {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .single()
    
    if (error) {
      console.error('Error loading settings:', error)
      return
    }
    
    if (data) {
      setWhatsappNumber(data.whatsapp_number)
      setTempNumber(data.whatsapp_number)
    }
  }

  const setupRealtimeSubscription = () => {
    try {
      const subscription = supabase
        .channel('dishes-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'dishes' }, () => {
          loadDishes()
        })
        .subscribe()

      const settingsSubscription = supabase
        .channel('settings-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
          loadSettings()
        })
        .subscribe()

      return () => {
        subscription.unsubscribe()
        settingsSubscription.unsubscribe()
      }
    } catch (e) {
      console.error('Realtime subscription failed:', e)
      // Return a no‑op cleanup function so useEffect can still return a function
      return () => {}
    }
  }

  const grouped = useMemo(() => {
    const matched = dishes.filter(d => d.available && d.time === time && `${d.name} ${d.description}`.toLowerCase().includes(query.toLowerCase()))
    return foodTypes.map(type => ({ type, items: matched.filter(d => d.category === type) })).filter(g => g.items.length > 0)
  }, [dishes, time, query])
  const totalFiltered = useMemo(() => grouped.reduce((n, g) => n + g.items.length, 0), [grouped])
  const selectedRating = selected ? staticRating(selected.id) : null
  const status = openStatus()
  const wa = (message: string) => `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
  const notify = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 2800) }

  // ===== Keranjang belanja (bisa lebih dari satu item & lebih dari satu jenis) =====
  const cartCount = useMemo(() => cart.reduce((n, line) => n + line.qty, 0), [cart])
  const cartTotal = useMemo(() => cart.reduce((sum, line) => sum + line.qty * line.dish.price, 0), [cart])
  const groupedCart = useMemo(
    () => foodTypes.map(type => ({ type, lines: cart.filter(l => l.dish.category === type) })).filter(g => g.lines.length > 0),
    [cart]
  )
  const qtyOf = (id: string) => cart.find(l => l.dish.id === id)?.qty || 0

  const addToCart = (dish: Dish, qty = 1) => {
    setCart(prev => {
      const exists = prev.find(l => l.dish.id === dish.id)
      if (exists) return prev.map(l => (l.dish.id === dish.id ? { ...l, qty: l.qty + qty } : l))
      return [...prev, { dish, qty }]
    })
    notify(`${qty > 1 ? `${qty}× ` : ''}${dish.name} masuk keranjang`)
  }

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(l => l.dish.id !== id))
      return
    }
    setCart(prev => prev.map(l => (l.dish.id === id ? { ...l, qty } : l)))
  }

  const removeLine = (id: string) => setCart(prev => prev.filter(l => l.dish.id !== id))
  const clearCart = () => { setCart([]); setOrderNote(''); notify('Keranjang dikosongkan.') }
  const openDish = (dish: Dish) => { setModalQty(1); setSelected(dish) }

  // Share lokasi pembeli (GPS browser) → dijadikan pin Google Maps untuk pesanan
  const shareLocation = () => {
    if (!('geolocation' in navigator)) { notify('Perangkat ini tidak mendukung pembagian lokasi.'); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude, accuracy } = pos.coords
        setSharedLoc({
          lat: Number(latitude.toFixed(6)),
          lng: Number(longitude.toFixed(6)),
          acc: Math.round(accuracy),
          url: `https://www.google.com/maps?q=${latitude.toFixed(6)},${longitude.toFixed(6)}`
        })
        setLocating(false)
        notify('Lokasi Anda berhasil dilampirkan ke pesanan.')
      },
      err => {
        setLocating(false)
        notify(err.code === err.PERMISSION_DENIED
          ? 'Izin lokasi ditolak. Izinkan akses lokasi di browser, lalu coba lagi.'
          : 'Gagal mendapatkan lokasi. Coba lagi atau isi alamat manual.')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const orderMessage = () => {
    const detail = groupedCart
      .map(g => `${g.type}\n${g.lines.map(l => `- ${l.qty}x ${l.dish.name} = ${money(l.qty * l.dish.price)}`).join('\n')}`)
      .join('\n\n')
    const note = orderNote.trim() ? `\n\nCatatan / alamat pengantaran:\n${orderNote.trim()}` : ''
    const loc = sharedLoc
      ? `\n\nShare lokasi pembeli (titik GPS):\n${sharedLoc.url} (akurasi ±${sharedLoc.acc} m, ${sharedLoc.lat}, ${sharedLoc.lng})`
      : ''
    return `Halo Bu Heni, saya mau pesan:\n\n${detail}\n\nTotal: ${money(cartTotal)} (${cartCount} item)${note}${loc}\n\nPengantaran maksimal jarak 2 km dari lokasi warung, ya Bu.`
  }

  const openEditor = (dish: Dish) => {
    setImageFile(null)
    setImagePreview(dish && dish.id !== 'new' ? dish.image : '')
    setEditing(dish)
  }
  const closeEditor = () => {
    setImageFile(null)
    setImagePreview('')
    setEditing(null)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('File harus berupa gambar.'); return }
    if (file.size > 4 * 1024 * 1024) { alert('Ukuran gambar maksimal 4MB.'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null
    const ext = imageFile.name.split('.').pop() || 'jpg'
    const fileName = `dish-${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`
    const { error } = await supabase.storage.from('dishes').upload(fileName, imageFile, { cacheControl: '3600', upsert: false })
    if (error) throw error
    const { data } = supabase.storage.from('dishes').getPublicUrl(fileName)
    return data.publicUrl
  }

  const handleAdminLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword
      })
      
      if (error) {
        setAdminLoginError(error.message || 'Email atau password salah')
        setAdminPassword('')
        return
      }
      
      setAdminAuth(true)
      setAdminEmail('')
      setAdminPassword('')
      setAdminLoginError('')
      notify('Login berhasil!')
    } catch (err) {
      setAdminLoginError('Terjadi kesalahan')
      setAdminPassword('')
    }
  }

  const saveDish = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setUploading(true)
    try {
      // Upload foto baru kalau ada file dipilih
      let imageUrl = String(form.get('image') || '')
      if (imageFile) {
        const uploadedUrl = await uploadImage()
        if (uploadedUrl) imageUrl = uploadedUrl
      }

      if (editing && editing.id !== 'new') {
        const { error } = await supabase
          .from('dishes')
          .update({
            name: String(form.get('name')),
            description: String(form.get('description')),
            price: Number(form.get('price')),
            category: String(form.get('category')),
            time: String(form.get('time')),
            image_url: imageUrl || editing.image,
            is_bestseller: form.get('best') === 'on',
            updated_at: new Date().toISOString()
          })
          .eq('id', editing.id)
        
        if (error) throw error
        notify('Menu berhasil diperbarui.')
      } else {
        const { error } = await supabase
          .from('dishes')
          .insert([{
            name: String(form.get('name')),
            description: String(form.get('description')),
            price: Number(form.get('price')),
            category: String(form.get('category')),
            time: String(form.get('time')),
            image_url: imageUrl || '',
            is_bestseller: form.get('best') === 'on',
            is_available: true
          }])
        
        if (error) throw error
        notify('Menu baru berhasil ditambahkan.')
      }
      
      setEditing(null)
      setImageFile(null)
      setImagePreview('')
      loadDishes()
    } catch (err) {
      notify('Error: Gagal menyimpan menu')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const removeDish = async (id: string) => {
    if (window.confirm('Hapus menu ini?')) {
      try {
        const { error } = await supabase
          .from('dishes')
          .delete()
          .eq('id', id)
        
        if (error) throw error
        notify('Menu telah dihapus.')
        loadDishes()
      } catch (err) {
        notify('Error: Gagal menghapus menu')
        console.error(err)
      }
    }
  }

  const handleSaveNumber = async () => {
    if (tempNumber.trim() && /^\d{10,15}$/.test(tempNumber)) {
      try {
        const { error } = await supabase
          .from('settings')
          .update({ whatsapp_number: tempNumber, updated_at: new Date().toISOString() })
          .eq('id', '1')
        
        if (error) throw error
        setWhatsappNumber(tempNumber)
        setEditingNumber(false)
        notify('Nomor WhatsApp berhasil diperbarui.')
      } catch (err) {
        notify('Error: Gagal mengupdate nomor')
        console.error(err)
      }
    } else {
      alert('Format nomor WhatsApp tidak valid. Gunakan hanya angka (10-15 digit).')
    }
  }

  const closeAdmin = async () => {
    setAdmin(false)
    setAdminAuth(false)
    setAdminEmail('')
    setAdminPassword('')
    setAdminLoginError('')
    setEditing(null)
    setImageFile(null)
    setImagePreview('')
    
    if (adminAuth) {
      await supabase.auth.signOut()
    }
  }

  return (
    <div className="app-shell">
      <nav className="topbar">
        <div className="nav-inner">
          <a className="brand" href="#home" onClick={() => setMobileNav(false)}><span className="brand-mark"><UtensilsCrossed size={19}/></span><span>WMJ<span className="brand-light">Store</span></span></a>
          <button className="mobile-toggle" aria-label="Buka navigasi" onClick={() => setMobileNav(!mobileNav)}><MenuIcon size={22}/></button>
          <div className={`nav-links ${mobileNav ? 'show' : ''}`}>
            <a href="#menu" onClick={() => setMobileNav(false)}>Menu</a>
            <a href="#cerita" onClick={() => setMobileNav(false)}>Tentang</a>
            <a href="#lokasi" onClick={() => setMobileNav(false)}>Lokasi</a>
            <button className="nav-cart" onClick={() => { setMobileNav(false); setCartOpen(true) }}><ShoppingBag size={15}/> Keranjang{cartCount > 0 && <span className="cart-badge">{cartCount}</span>}</button>
            <a className="nav-contact" href={wa('Halo Bu Heni, saya ingin bertanya.')} target="_blank" rel="noreferrer"><Phone size={15}/> Hubungi kami</a>
          </div>
        </div>
      </nav>

      <main>
        <section className="hero" id="home">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot"/> MASAKAN RUMAHAN · SEJAK 2012</div>
            <h1>Rasa rumah,<br/><em>selalu dirindukan.</em></h1>
            <p>Masakan rumahan enak & terjangkau, dimasak hangat setiap hari dengan resep keluarga.</p>
            <div className="hero-meta">
              <span><MapPin size={16}/> Jl. Kawi, Semen, Kec. Gandusari, Kabupaten Blitar, Jawa Timur 66187</span>
              <span className={`open-status ${status.open ? 'is-open' : ''}`}><i/> {status.text}</span>
              <span><Clock3 size={16}/> Jam buka · {hoursLine} WIB</span>
            </div>
            <div className="hero-actions">
              <a className="btn-primary" href={wa('Halo Bu Heni, saya mau pesan menu.')} target="_blank" rel="noreferrer"><ShoppingBag size={17}/> Pesan via WhatsApp <ArrowRight size={16}/></a>
              <a className="btn-outline" href="#lokasi">Lihat lokasi <ArrowDown size={15}/></a>
            </div>
            <div className="hero-note">
              <span className="avatar-stack"><i>👩🏻‍🍳</i><i>🌿</i><i>🍚</i></span>
              <span><b>Selalu dibuat segar</b><small>Rasa rumahan sejak 2012</small></span>
              <span className="rating">★★★★★ <small>4.9</small></span>
            </div>
          </div>
          <div className="hero-visual">
            <img src="/images/hero-warung.jpg" alt="Hidangan rumahan Warung"/>
            <div className="image-stamp"><span>♡</span><div><b>Dimasak dengan hati</b><small>Resep keluarga Turun Temurun</small></div></div>
            <div className="vertical-note">DAPUR RUMAHAN · BLITAR</div>
          </div>
        </section>

        <section className="menu-section section-wrap" id="menu">
          <div className="section-heading">
            <div>
              <div className="eyebrow">DARI DAPUR KAMI</div>
              <h2>Menu favorit <em>hari ini</em></h2>
              <p>Enak, hangat, dan selalu bikin ingin tambah.</p>
            </div>
            <div className="menu-count"><span>06</span><small>pilihan<br/>rumahan</small></div>
          </div>
          <div className="menu-controls">
            <div className="category-list">
              {times.map(t => <button key={t} className={`category-pill ${time === t ? 'active' : ''}`} onClick={() => setTime(t)}>{t}</button>)}
            </div>
            <label className="search-box"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari menu..."/><kbd>⌘ K</kbd></label>
          </div>
          {totalFiltered ? (
            <div className="menu-groups">
              {grouped.map(group => (
                <div className="menu-group" key={group.type}>
                  <div className="menu-group-title"><span>{group.type}</span><i/></div>
                  <div className="menu-grid">
                    {group.items.map(dish => (
                      <article className="dish-card" key={dish.id}>
                        <button className="dish-image" onClick={() => openDish(dish)} aria-label={`Lihat ${dish.name}`}>
                          <img src={dish.image} alt={dish.name}/>
                          {dish.best && <span className="best-badge"><Flame size={12} fill="currentColor"/> BEST SELLER</span>}
                          <span className="image-arrow"><ArrowRight size={16}/></span>
                        </button>
                        <div className="dish-info">
                          <div className="dish-title-line">
                            <div><span className="dish-category">{dish.category}</span><h3>{dish.name}</h3></div>
                            <span className="rating-badge" title="Rating sementara (statis)"><Star size={13} strokeWidth={0} fill="currentColor"/><b>{staticRating(dish.id).value}</b></span>
                          </div>
                          <p>{dish.description}</p>
                          <div className="dish-bottom">
                            <strong>{money(dish.price)}</strong>
                            <button className="add-order" onClick={() => addToCart(dish)}>
                              {qtyOf(dish.id) ? `Di keranjang (${qtyOf(dish.id)})` : 'Tambah'} <Plus size={15}/>
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state"><Search size={25}/><b>Menu belum ditemukan</b><span>Coba kata kunci lain atau ganti waktu menu.</span></div>
          )}
          <div className="menu-footnote">
            <span><Sparkles size={15}/> Menu {time} dimasak fresh setiap hari</span>
            <button onClick={() => {setTime('Menu Pagi');setQuery('')}}>Lihat menu pagi <ArrowRight size={15}/></button>
          </div>
        </section>

        <section className="story-section" id="cerita">
          <div className="story-image">
            <img src="/images/ayam-bakar.jpg" alt="Hidangan khas dapur"/>
            <span className="story-stamp">DARI DAPUR<br/>DENGAN CINTA</span>
          </div>
          <div className="story-copy">
            <div className="eyebrow">CERITA KAMI</div>
            <h2>Rasa sederhana,<br/><em>cerita istimewa.</em></h2>
            <p>Warung ini bermula dari dapur kecil dan resep turun-temurun. Kini, kami tetap percaya bahwa makanan terbaik adalah yang dibuat dengan bahan segar, bumbu pilihan, dan sepenuh hati.</p>
            <div className="story-facts">
              <div><b>12<span>+</span></b><small>Tahun menyajikan rasa</small></div>
              <div><b>100<span>%</span></b><small>Bahan segar pilihan</small></div>
              <div><b>♡</b><small>Dibuat dengan cinta</small></div>
            </div>
            <button className="text-link" onClick={() => setAboutOpen(true)}>Kenali WMJ Store<ArrowRight size={16}/></button>
          </div>
        </section>

        <section className="location-section section-wrap" id="lokasi">
          <div className="location-copy">
            <div className="eyebrow">MAMPIR, YUK</div>
            <h2>Kami tunggu<br/><em>di sini.</em></h2>
            <p>Sepiring masakan rumahan hangat selalu punya tempat untukmu.</p>
            <div className="address-line">
              <span className="address-icon"><MapPin size={18}/></span>
              <div><b>WMJ Store</b><span>Jl. Kawi<br/>Semen, Kec. Gandusari, Kabupaten Blitar, Jawa Timur 66187</span></div>
            </div>
            <div className="address-line">
              <span className="address-icon"><Clock3 size={18}/></span>
              <div>
                <b>Jam buka - tutup</b>
                {HOURS.map(h => <span key={h.label}>Sesi {h.label.toLowerCase()} · {h.open} – {h.close} WIB</span>)}
              </div>
            </div>
            <div className="address-line">
              <span className="address-icon"><MapPin size={18}/></span>
              <div><b>Jarak pengantaran</b><span>Maksimal 2 km dari lokasi warung</span></div>
            </div>
            <a className="btn-primary map-link" href="https://maps.app.goo.gl/5eKJupkPYSxpstVf8" target="_blank" rel="noreferrer"><MapPin size={16}/> Buka Google Maps <ArrowRight size={16}/></a>
          </div>
          <div className="map-card">
            <div className="map-pattern">
              <div className="map-road road-one"/><div className="map-road road-two"/><div className="map-road road-three"/>
              <div className="map-block block-one"/><div className="map-block block-two"/><div className="map-block block-three"/><div className="map-block block-four"/>
              <div className="map-pin"><MapPin size={22} fill="currentColor"/></div>
              <div className="map-caption"><span className="map-caption-icon">🍲</span><div><b>WMJ Store</b><small>Masakan rumahan · 5 menit dari sini</small></div><ArrowRight size={16}/></div>
              <span className="map-label label-a">BACIRO</span><span className="map-label label-b">JL. MELATI</span>
            </div>
            <span className="map-credit">PETA AREA WARUNG</span>
          </div>
        </section>

        <section className="cta-strip">
          <div className="cta-sun">☀</div>
          <div><h2>Lagi lapar? <em>Bu Heni, siap masak.</em></h2><p>Pesan dulu, nanti kami siapkan hangat-hangat.</p></div>
          <a href={wa('Halo Bu Heni, saya ingin memesan makanan.')} target="_blank" rel="noreferrer" className="cta-button">Pesan via WhatsApp <ArrowRight size={16}/></a>
        </section>
      </main>

      <footer className="footer">
        <a className="brand" href="#home"><span className="brand-mark"><UtensilsCrossed size={17}/></span><span>WMJ<span className="brand-light">Store</span></span></a>
        <span>© 2026 WMJ Store <i>·</i> Digital Menu</span>
        <div className="footer-social">
          <a href="https://instagram.com" aria-label="Instagram"><Instagram size={17}/></a>
          <a href="tel:+6281234567890" aria-label="Telepon"><Phone size={16}/></a>
          <button onClick={() => setAdmin(true)} title="Kelola menu"><Settings2 size={17}/></button>
        </div>
      </footer>
      <a className="floating-wa" href={wa('Halo Bu Heni, saya mau pesan menu.')} target="_blank" rel="noreferrer" aria-label="Chat WhatsApp"><span className="wa-pulse"/><WhatsAppMark/></a>

      <button className="cart-fab" onClick={() => setCartOpen(true)} aria-label="Buka keranjang belanja">
        <ShoppingBag size={21}/>
        {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
      </button>

      {cartOpen && (
        <div className="cart-backdrop" onClick={() => setCartOpen(false)}>
          <aside className="cart-drawer" onClick={e => e.stopPropagation()} aria-label="Keranjang belanja">
            <header className="cart-header">
              <div>
                <div className="eyebrow"><span className="eyebrow-dot"/> PESANAN ANDA</div>
                <h2>Keranjang</h2>
              </div>
              <button className="modal-close cart-close" onClick={() => setCartOpen(false)} aria-label="Tutup keranjang"><X size={19}/></button>
            </header>

            <div className="cart-body">
              {cart.length ? (
                <div className="cart-lines">
                  {groupedCart.map(group => (
                    <div className="cart-group" key={group.type}>
                      <div className="cart-group-title"><span>{group.type}</span><i/></div>
                      {group.lines.map(({ dish, qty }) => (
                        <div className="cart-line" key={dish.id}>
                          <img src={dish.image} alt={dish.name}/>
                          <div className="cart-line-info">
                            <b>{dish.name}</b>
                            <small>{money(dish.price)}</small>
                            <div className="qty-stepper qty-small">
                              <button type="button" aria-label={`Kurangi ${dish.name}`} onClick={() => updateQty(dish.id, qty - 1)}><Minus size={13}/></button>
                              <b>{qty}</b>
                              <button type="button" aria-label={`Tambah ${dish.name}`} onClick={() => updateQty(dish.id, qty + 1)}><Plus size={13}/></button>
                            </div>
                          </div>
                          <div className="cart-line-right">
                            <strong>{money(dish.price * qty)}</strong>
                            <button type="button" className="cart-remove" onClick={() => removeLine(dish.id)}><X size={12}/> Hapus</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="cart-empty">
                  <ShoppingBag size={26}/>
                  <b>Keranjang masih kosong</b>
                  <span>Tambah menu makanan atau minuman favoritmu dulu, ya.</span>
                </div>
              )}
            </div>

            <footer className="cart-footer">
              <label className="cart-note-field">
                Catatan & alamat pengantaran <small>(opsional · ancer-ancer)</small>
                <textarea value={orderNote} onChange={e => setOrderNote(e.target.value)} rows={2} placeholder="Contoh: Jl. Melati No. 12, gang sebelah warung, tanpa pedas"/>
              </label>

              <div className="cart-loc">
                {!sharedLoc ? (
                  <button type="button" className="loc-share-btn" onClick={shareLocation} disabled={locating}>
                    <MapPin size={15}/> {locating ? 'Mendeteksi lokasi...' : 'Share lokasi saya (GPS)'}
                  </button>
                ) : (
                  <div className="loc-shared">
                    <span className="loc-icon"><MapPin size={15}/></span>
                    <div className="loc-info">
                      <b>Lokasi terlampir</b>
                      <small>Titik GPS · akurasi ±{sharedLoc.acc} m</small>
                    </div>
                    <a href={sharedLoc.url} target="_blank" rel="noreferrer">Lihat peta</a>
                    <button type="button" className="loc-remove" aria-label="Hapus lokasi" onClick={() => setSharedLoc(null)}><X size={13}/></button>
                  </div>
                )}
                <p className="loc-hint">{sharedLoc
                  ? 'Titik ini otomatis ikut terkirim ke pesanan WhatsApp.'
                  : 'Pilih titik di HP → kirim, atau isi alamat di kolom atas.'}</p>
              </div>
              <div className="cart-summary">
                <span>Subtotal · {cartCount} item</span>
                <b>{money(cartTotal)}</b>
              </div>
              <p className="cart-delivery-note"><MapPin size={14}/> Pengantaran maksimal jarak 2 km dari lokasi warung.</p>
              <div className="cart-actions">
                <button type="button" className="btn-outline" onClick={clearCart} disabled={!cart.length}>Kosongkan</button>
                {cart.length ? (
                  <a className="btn-primary" href={wa(orderMessage())} target="_blank" rel="noreferrer"><WhatsAppMark/> Pesan via WhatsApp</a>
                ) : (
                  <button type="button" className="btn-primary" disabled>Keranjang kosong</button>
                )}
              </div>
            </footer>
          </aside>
        </div>
      )}

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="dish-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}><X size={20}/></button>
            <div className="dish-modal-media">
              <img src={selected.image} alt={selected.name}/>
              {selected.best && <span className="best-badge modal-best"><Flame size={12} fill="currentColor"/> BEST SELLER</span>}
            </div>
            <div className="modal-body">
              <div className="modal-eyebrow"><span className="eyebrow-dot"/>{selected.time} · {selected.category}</div>
              <h2>{selected.name}</h2>
              <p className="modal-description">{selected.description}</p>

              <div className="modal-chips">
                <span className="modal-chip"><UtensilsCrossed size={14}/> {selected.category}</span>
                <span className="modal-chip"><Clock3 size={14}/> {selected.time}</span>
                <span className="modal-chip"><Sparkles size={14}/> Dimasak fresh</span>
                {selected.best && <span className="modal-chip chip-best"><Flame size={14} fill="currentColor"/> Best Seller</span>}
                <span className="modal-chip chip-delivery"><MapPin size={14}/> Antar maks. 2 km</span>
              </div>

              <div className="modal-price-row">
                <div className="modal-price-label">
                  <small>Harga</small>
                  <strong>{money(selected.price)}</strong>
                </div>
                <div className="modal-rating" title="Rating sementara (statis)">
                  <span className="rating-stars">
                    {[1, 2, 3, 4, 5].map(step => (
                      <Star key={step} size={15} strokeWidth={0} fill="currentColor" className={selectedRating && step <= ratingStars(selectedRating.value) ? 'is-on' : ''}/>
                    ))}
                  </span>
                  <b>{selectedRating?.value}</b>
                  <small>{selectedRating?.reviews} ulasan</small>
                </div>
              </div>

              <div className="qty-row">
                <div className="qty-label">
                  <small>Jumlah</small>
                  <span>Subtotal {money(selected.price * modalQty)}</span>
                </div>
                <div className="qty-stepper">
                  <button type="button" aria-label="Kurangi jumlah" onClick={() => setModalQty(q => Math.max(1, q - 1))}><Minus size={15}/></button>
                  <b>{modalQty}</b>
                  <button type="button" aria-label="Tambah jumlah" onClick={() => setModalQty(q => q + 1)}><Plus size={15}/></button>
                </div>
              </div>

              <button className="btn-primary modal-order" onClick={() => { addToCart(selected, modalQty); setSelected(null); setCartOpen(true) }}>
                <ShoppingBag size={17}/> Tambah ke keranjang <ArrowRight size={16}/>
              </button>
              <a className="modal-wa-link" href={wa(`Halo Bu Heni, saya ingin pesan ${modalQty}x ${selected.name} (${money(selected.price * modalQty)}).`)} target="_blank" rel="noreferrer"><WhatsAppMark/> Pesan langsung via WhatsApp</a>
              <p className="modal-foot-note">Pesanan diteruskan langsung ke WhatsApp Bu Heni. Menu dimasak hangat setelah pesanan diterima. <b>Pengantaran maksimal dalam jarak 2 km dari lokasi warung.</b></p>
            </div>
          </div>
        </div>
      )}

      {aboutOpen && (
        <div className="modal-backdrop" onClick={() => setAboutOpen(false)}>
          <div className="about-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setAboutOpen(false)}><X size={20}/></button>
            <div className="eyebrow">CERITA WARUNG</div>
            <h2>Rumah kecil untuk rasa yang besar.</h2>
            <p>Sejak 2012, WMJ Store menyajikan masakan rumahan khas Jawa dengan resep keluarga. Kami memilih bahan segar dari pasar setiap pagi dan memasak dalam porsi kecil agar selalu hangat saat sampai di meja.</p>
            <div className="about-hours"><Clock3 size={18}/><span><b>Jam buka - tutup</b><br/>{hoursLine} WIB</span></div>
            <a className="btn-primary" href={wa('Halo Bu Heni!')} target="_blank" rel="noreferrer">Sapa Bu Heni <ArrowRight size={16}/></a>
          </div>
        </div>
      )}

      {admin && !adminAuth && (
        <div className="admin-backdrop">
          <div className="admin-login-panel">
            <div className="admin-login-content">
              <div className="login-icon"><Lock size={28}/></div>
              <h2>Masuk ke Panel Admin</h2>
              <p>Masukkan email dan password untuk mengakses pengelola menu.</p>
              <form onSubmit={handleAdminLogin}>
                <input type="email" placeholder="Email admin" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} autoFocus required/>
                <input type="password" placeholder="Password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} required/>
                {adminLoginError && <div className="login-error">{adminLoginError}</div>}
                <div className="form-actions">
                  <button type="button" className="btn-outline" onClick={() => setAdmin(false)}>Batal</button>
                  <button type="submit" className="btn-primary">Masuk</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {admin && adminAuth && (
        <div className="admin-backdrop">
          <div className="admin-panel">
            <header className="admin-header">
              <button className="admin-back" onClick={() => closeAdmin()}><ArrowLeft size={17}/> Kembali ke menu</button>
              <span className="admin-label"><Settings2 size={17}/> Panel pengelola</span>
              <button className="modal-close admin-x" onClick={() => closeAdmin()}><X size={19}/></button>
            </header>

            {editing ? (
              <div className="admin-form-wrap">
                <div className="eyebrow">{editing.id === 'new' ? 'MENU BARU' : 'PERBARUI MENU'}</div>
                <h2>{editing.id === 'new' ? 'Tambah menu' : 'Edit menu'}</h2>
                <form className="admin-form" onSubmit={saveDish}>
                  <label>Nama menu<input name="name" required defaultValue={editing.id === 'new' ? '' : editing.name} placeholder="Contoh: Ayam goreng kremes"/></label>
                  <label>Deskripsi<textarea name="description" required defaultValue={editing.id === 'new' ? '' : editing.description} placeholder="Jelaskan menu secara singkat"/></label>
                  <div className="form-row">
                    <label>Harga (Rp)<input name="price" type="number" min="1000" required defaultValue={editing.id === 'new' ? '' : editing.price}/></label>
                    <label>Jenis<select name="category" defaultValue={editing.id === 'new' ? 'Makanan' : (editing.category === 'Menu Utama' ? 'Makanan' : editing.category)}>{foodTypes.map(c => <option key={c}>{c}</option>)}</select></label>
                  </div>
                  <div className="form-row">
                    <label>Waktu menu<select name="time" defaultValue={editing.id === 'new' ? 'Menu Pagi' : (editing.time || 'Menu Pagi')}>{times.map(t => <option key={t}>{t}</option>)}</select></label>
                    <label>URL foto (opsional)<input name="image" defaultValue={editing.id === 'new' ? '' : editing.image} placeholder="https://... (atau upload di bawah)"/></label>
                  </div>
                  <label className="upload-field">Foto menu
                    <div className="upload-area">
                      <input type="file" name="photo" accept="image/*" onChange={handleImageChange} disabled={uploading}/>
                      {(imagePreview || (editing.id !== 'new' && editing.image)) ? (
                        <div className="upload-preview"><img src={imagePreview || editing.image} alt="Preview"/><button type="button" className="upload-clear" onClick={() => { setImageFile(null); setImagePreview(''); const inp = document.querySelector<HTMLInputElement>('input[name="photo"]'); if (inp) inp.value = '' }}><X size={14}/></button></div>
                      ) : (
                        <div className="upload-placeholder"><Upload size={22}/><span>Klik untuk pilih gambar</span><small>JPG/PNG · maks 4MB</small></div>
                      )}
                    </div>
                  </label>
                  <label className="check-label"><input name="best" type="checkbox" defaultChecked={editing.id !== 'new' && editing.best}/> Tandai sebagai Best Seller</label>
                  <div className="form-actions">
                    <button type="button" className="btn-outline" onClick={() => closeEditor()}>Batal</button>
                    <button className="btn-primary" type="submit" disabled={uploading}>{uploading ? 'Mengunggah...' : 'Simpan menu'} {!uploading && <ArrowRight size={16}/>}</button>
                  </div>
                </form>
              </div>
            ) : (
              <>
                <div className="admin-intro">
                  <div className="eyebrow">DAPUR DIGITAL · ADMIN</div>
                  <h1>Kelola menu <em>dengan mudah.</em></h1>
                  <p>Perbarui daftar hidangan WMJ Store.</p>
                </div>
                <div className="admin-stats">
                  <div><span>MENU AKTIF</span><b>{dishes.length.toString().padStart(2, '0')}</b></div>
                  <div><span>KATEGORI</span><b>03</b></div>
                  <div><span>BEST SELLER</span><b>{dishes.filter(d => d.best).length.toString().padStart(2, '0')}</b></div>
                </div>

                <div className="admin-settings-section">
                  <h3>Pengaturan WhatsApp</h3>
                  <div className="settings-card">
                    {editingNumber ? (
                      <div className="number-edit">
                        <label>
                          Nomor WhatsApp
                          <div className="number-input-group">
                            <input type="text" placeholder="628123456789" value={tempNumber} onChange={e => setTempNumber(e.target.value)} maxLength={15}/>
                          </div>
                          <small>Format: 62 + nomor telepon (tanpa +)</small>
                        </label>
                        <div className="form-actions">
                          <button type="button" className="btn-outline" onClick={() => {setEditingNumber(false); setTempNumber(whatsappNumber)}}>Batal</button>
                          <button type="button" className="btn-primary" onClick={handleSaveNumber}>Simpan nomor</button>
                        </div>
                      </div>
                    ) : (
                      <div className="number-display">
                        <div className="number-info">
                          <span className="number-label">Nomor WhatsApp</span>
                          <span className="number-value">{whatsappNumber}</span>
                        </div>
                        <button className="btn-outline" onClick={() => {setEditingNumber(true); setTempNumber(whatsappNumber)}}>Ubah nomor</button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="admin-toolbar">
                  <div><h2>Daftar menu</h2><span>Kelola hidangan dan ketersediaan</span></div>
                  <button className="btn-primary" onClick={() => openEditor({id:'new',name:'',description:'',price:0,category:'Makanan',time:'Menu Pagi',image:'',best:false,available:true})}><Plus size={17}/> Tambah menu</button>
                    <button className="btn-outline" onClick={seedDefaultDishes}>Seed default menu</button>
                </div>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr><th>MENU</th><th>JENIS</th><th>WAKTU</th><th>HARGA</th><th>STATUS</th><th></th></tr>
                    </thead>
                    <tbody>
                      {dishes.map(d => (
                        <tr key={d.id}>
                          <td><div className="table-dish"><img src={d.image} alt=""/><b>{d.name}</b></div></td>
                          <td>{d.category === 'Menu Utama' ? 'Makanan' : d.category}</td>
                          <td>{d.time || 'Menu Pagi'}</td>
                          <td>{money(d.price)}</td>
                          <td><span className="status-tag">● Tersedia</span>{d.best && <span className="table-bestseller">Best Seller</span>}</td>
                          <td><div className="table-actions"><button onClick={() => openEditor(d)}>Edit</button><button className="delete-btn" onClick={() => removeDish(d.id)}>Hapus</button></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="admin-tip"><Sparkles size={17}/><span><b>Tips:</b> Gunakan foto dengan pencahayaan alami agar menu terlihat lebih menggugah selera.</span></div>
              </>
            )}
          </div>
        </div>
      )}

      {notice && <div className="toast-message"><span>✓</span>{notice}</div>}
    </div>
  )
}

function WhatsAppMark() { return <span className="whatsapp-mark">◔</span> }
export default App
