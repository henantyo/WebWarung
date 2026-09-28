import { useMemo, useState, useEffect } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, Clock3, Flame, Heart, Instagram, Lock, MapPin, Menu as MenuIcon, Minus, Phone, Plus, Search, Settings2, ShoppingBag, Sparkles, Upload, UtensilsCrossed, X } from 'lucide-react'
import './App.css'
import { supabase } from './lib/supabase'

type Dish = { id: string; name: string; description: string; price: number; category: string; time: string; image: string; best: boolean; available: boolean }
const initialDishes: Dish[] = []
const times = ['Menu Pagi', 'Menu Malam'];
const foodTypes = ['Makanan', 'Minuman', 'Camilan'];

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

function App() {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [time, setTime] = useState('Menu Pagi')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Dish | null>(null)
  const [admin, setAdmin] = useState(false)
  const [adminAuth, setAdminAuth] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminLoginError, setAdminLoginError] = useState('')
  const [editing, setEditing] = useState<Dish | null>(null)
  const [notice, setNotice] = useState('')
  const [mobileNav, setMobileNav] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [saved, setSaved] = useState<string[]>([])
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
  const wa = (message: string) => `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
  const notify = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 2800) }
  const toggleSaved = (id: string) => setSaved(current => current.includes(id) ? current.filter(x => x !== id) : [...current, id])

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
              <span><MapPin size={16}/> Jl. Melati No. 18, Yogyakarta</span>
              <span><Clock3 size={16}/> Buka hari ini · 08.00–21.00</span>
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
            <div className="vertical-note">DAPUR RUMAHAN · YOGYAKARTA</div>
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
                        <button className="dish-image" onClick={() => setSelected(dish)} aria-label={`Lihat ${dish.name}`}>
                          <img src={dish.image} alt={dish.name}/>
                          {dish.best && <span className="best-badge"><Flame size={12} fill="currentColor"/> BEST SELLER</span>}
                          <span className="image-arrow"><ArrowRight size={16}/></span>
                        </button>
                        <div className="dish-info">
                          <div className="dish-title-line">
                            <div><span className="dish-category">{dish.category}</span><h3>{dish.name}</h3></div>
                            <button className={`save-button ${saved.includes(dish.id) ? 'is-saved' : ''}`} aria-label="Simpan menu" onClick={() => toggleSaved(dish.id)}><Heart size={17} fill={saved.includes(dish.id) ? 'currentColor' : 'none'}/></button>
                          </div>
                          <p>{dish.description}</p>
                          <div className="dish-bottom">
                            <strong>{money(dish.price)}</strong>
                            <button className="add-order" onClick={() => setSelected(dish)}>Pesan <Plus size={15}/></button>
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
              <div><b>WMJ Store</b><span>Jl. Melati No. 18, Baciro, Gondokusuman,<br/>Kota Yogyakarta, DI Yogyakarta 55225</span></div>
            </div>
            <div className="address-line">
              <span className="address-icon"><Clock3 size={18}/></span>
              <div><b>Jam operasional</b><span>Setiap hari, 08.00 – 21.00 WIB</span></div>
            </div>
            <a className="btn-primary map-link" href="https://maps.google.com/?q=Jl.+Melati+No.+18,+Yogyakarta" target="_blank" rel="noreferrer"><MapPin size={16}/> Buka Google Maps <ArrowRight size={16}/></a>
          </div>
          <div className="map-card">
            <div className="map-pattern">
              <div className="map-road road-one"/><div className="map-road road-two"/><div className="map-road road-three"/>
              <div className="map-block block-one"/><div className="map-block block-two"/><div className="map-block block-three"/><div className="map-block block-four"/>
              <div className="map-pin"><MapPin size={22} fill="currentColor"/></div>
              <div className="map-caption"><span className="map-caption-icon">🍲</span><div><b>Warung Bu Heni</b><small>Masakan rumahan · 5 menit dari sini</small></div><ArrowRight size={16}/></div>
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
        <a className="brand" href="#home"><span className="brand-mark"><UtensilsCrossed size={17}/></span><span>warung<span className="brand-light">bu Heni</span></span></a>
        <span>© 2026 Warung Bu Heni <i>·</i> Digital Menu</span>
        <div className="footer-social">
          <a href="https://instagram.com" aria-label="Instagram"><Instagram size={17}/></a>
          <a href="tel:+6281234567890" aria-label="Telepon"><Phone size={16}/></a>
          <button onClick={() => setAdmin(true)} title="Kelola menu"><Settings2 size={17}/></button>
        </div>
      </footer>
      <a className="floating-wa" href={wa('Halo Bu Heni, saya mau pesan menu.')} target="_blank" rel="noreferrer" aria-label="Chat WhatsApp"><span className="wa-pulse"/><WhatsAppMark/></a>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="dish-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}><X size={20}/></button>
            <img src={selected.image} alt={selected.name}/>
            <div className="modal-body">
              <span className="dish-category">{selected.time} · {selected.category}{selected.best ? ' · BEST SELLER' : ''}</span>
              <h2>{selected.name}</h2>
              <p>{selected.description}</p>
              <div className="modal-price">{money(selected.price)}</div>
              <a className="btn-primary modal-order" href={wa(`Halo Bu Heni, saya ingin pesan ${selected.name} (${money(selected.price)}).`)} target="_blank" rel="noreferrer"><WhatsAppMark/> Pesan menu ini</a>
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
            <div className="about-hours"><Clock3 size={18}/><span><b>Jam operasional</b><br/>Setiap hari · 08.00–21.00 WIB</span></div>
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
