import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { 
  Sparkles, 
  Play, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Download
} from 'lucide-react'
import jsPDF from 'jspdf'
import rbLogo from './assets/Logo_RB4RK.jpg'

// Types
interface Book {
  id: number
  title: string
  cover: string
  ageGroup: string
  topic: string
  pages: BookPage[]
  style: string
}

interface BookPage {
  pageNum: number
  text: string
  illustration: string
}

interface FormData {
  keywords: string
  topic: string
  ageGroup: string
  pageCount: number
  illustrationStyle: string
  diversityMode: string
}

// Form options - Creation Hub spec
const topics = ["Nature", "Friendship", "Science", "Daily Routine", "Adventure", "Fantasy", "Family", "Bedtime Stories"]
const ageGroups = ["0-2", "3-4", "5-6"]
const illustrationStyles = ["Watercolor", "3D Clay", "Minimalist", "Random ✨"]
const diversityModes = ["None", "Multicultural Characters", "Different Abilities", "Mixed Families", "Global Traditions"]
const pageCounts = [3, 4, 5, 6, 8]

function App() {
  const [activeSection, setActiveSection] = useState<'home' | 'browse' | 'create' | 'mybooks' | 'community'>('home')
  const [savedBooks, setSavedBooks] = useState<Book[]>(() => {
    try { return JSON.parse(localStorage.getItem('savedBooks') || '[]') } catch { return [] }
  })
  useEffect(() => { localStorage.setItem('savedBooks', JSON.stringify(savedBooks)) }, [savedBooks])

  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [isFlipping, setIsFlipping] = useState(false)
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev' | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [, setGeneratedBook] = useState<Book | null>(null)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const [sampleBooks, setSampleBooks] = useState<Book[]>([])

  // Filter state for Browse & My Books
  const [searchTerm, setSearchTerm] = useState('')
  const [topicFilter, setTopicFilter] = useState('')
  const [ageFilter, setAgeFilter] = useState('')
  const [styleFilter, setStyleFilter] = useState('')

  // Fetch sample books from API
  useEffect(() => {
    fetch("/hackathon/preview/just-a-kid-wanting-to-read/api/books")
      .then(res => res.json())
      .then((data: Book[]) => setSampleBooks(data))
      .catch(() => setSampleBooks([]))
  }, [])

  // Form state
  const [formData, setFormData] = useState<FormData>({
    keywords: "",
    topic: topics[0],
    ageGroup: ageGroups[1],
    pageCount: 4,
    illustrationStyle: illustrationStyles[0],
    diversityMode: diversityModes[0]
  })

  // Dynamic placeholder cycling
  const placeholderIdeas = [
    "A brave turtle who loves stars...",
    "The day the clouds turned into marshmallows...",
    "A little fox who learned to share her berries...",
    "What if our toys came alive at midnight?",
    "A dragon who was scared of fire...",
    "The garden where flowers could whisper secrets...",
  ]
  const [placeholderIndex, setPlaceholderIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholderIdeas.length)
    }, 2800)
    return () => clearInterval(interval)
  }, [])

  // Keyboard controls for book reader modal (ESC close, arrows navigate)
  useEffect(() => {
    if (!selectedBook) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      } else if (e.key === 'ArrowRight') {
        if (currentPageIndex < selectedBook.pages.length - 1) nextPage();
      } else if (e.key === 'ArrowLeft') {
        if (currentPageIndex > 0) prevPage();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedBook, currentPageIndex]);

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleGenerateBook = async () => {
    if (formData.keywords.trim().length < 3) {
      alert("Please enter at least 3 words for keywords/ideas!")
      return
    }

    setIsGenerating(true)

    try {
      const res = await fetch("/hackathon/preview/just-a-kid-wanting-to-read/api/books/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error("Failed to generate book")
      const newBook: Book = await res.json()

      setGeneratedBook(newBook)
      setSelectedBook(newBook)
      setCurrentPageIndex(0)

      // Magical confetti!
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } })
      setTimeout(() => {
        confetti({ particleCount: 100, angle: 60, spread: 55, origin: { x: 0.1 } })
      }, 250)
    } catch (err) {
      alert("Sorry, generation failed. Try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  // Regenerate current book using same formData (for user not satisfied with results)
  const handleRegenerateBook = async () => {
    if (formData.keywords.trim().length < 3) {
      alert("Please enter at least 3 words for keywords/ideas!")
      return
    }
    setIsGenerating(true)
    try {
      const res = await fetch("/hackathon/preview/just-a-kid-wanting-to-read/api/books/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error("Failed to regenerate")
      const newBook: Book = await res.json()

      setGeneratedBook(newBook)
      setSelectedBook(newBook)
      setCurrentPageIndex(0)

      // Confetti!
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } })
      setTimeout(() => {
        confetti({ particleCount: 100, angle: 60, spread: 55, origin: { x: 0.1 } })
      }, 250)
    } catch (err) {
      alert("Sorry, regenerate failed. Try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const closeModal = () => {
    setSelectedBook(null)
    setCurrentPageIndex(0)
    window.speechSynthesis?.cancel()
  }

  const stopSpeaking = () => {
    if (currentAudio) {
      currentAudio.pause()
      setCurrentAudio(null)
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel()
    }
  }

  const speak = async () => {
    if (!selectedBook) return
    // Toggle: if already playing, stop
    if (currentAudio && !currentAudio.paused) {
      stopSpeaking()
      return
    }
    const text = selectedBook.pages[currentPageIndex]?.text || ""
    if (!text) return
    // Stop any previous
    stopSpeaking()
    try {
      const res = await fetch("/hackathon/preview/just-a-kid-wanting-to-read/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice_id: "eve", language: "en" }),
      })
      if (!res.ok) throw new Error("TTS failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.onended = () => setCurrentAudio(null)
      audio.play()
      setCurrentAudio(audio)
    } catch (e) {
      console.error("Grok Voice failed, fallback to browser:", e)
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.onend = () => setCurrentAudio(null)
        window.speechSynthesis.speak(utterance)
        // browser speech doesn't give us an element to track; leave currentAudio null
      }
    }
  }

  const nextPage = () => {
    if (selectedBook && currentPageIndex < selectedBook.pages.length - 1 && !isFlipping) {
      setFlipDirection('next')
      setIsFlipping(true)
      setTimeout(() => {
        setCurrentPageIndex(currentPageIndex + 1)
        setIsFlipping(false)
        setFlipDirection(null)
      }, 650)
    }
  }

  const prevPage = () => {
    if (currentPageIndex > 0 && !isFlipping) {
      setFlipDirection('prev')
      setIsFlipping(true)
      setTimeout(() => {
        setCurrentPageIndex(currentPageIndex - 1)
        setIsFlipping(false)
        setFlipDirection(null)
      }, 650)
    }
  }

  const downloadBook = async (book: Book) => {
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [600, 800] })
      const pageW = 600, pageH = 800
      for (let i = 0; i < book.pages.length; i++) {
        const pg = book.pages[i]
        // Proxy through our backend to avoid CORS
        const imgResp = await fetch(`/hackathon/preview/just-a-kid-wanting-to-read/api/image?url=${encodeURIComponent(pg.illustration)}`)
        const imgBlob = await imgResp.blob()
        const dataUrl: string = await new Promise((res, rej) => {
          const fr = new FileReader()
          fr.onload = () => res(fr.result as string)
          fr.onerror = rej
          fr.readAsDataURL(imgBlob)
        })
        const img = await new Promise<HTMLImageElement>((res, rej) => {
          const im = new Image()
          im.onload = () => res(im)
          im.onerror = rej
          im.src = dataUrl
        })
        const c = document.createElement('canvas')
        c.width = pageW; c.height = pageH
        const ctx = c.getContext('2d')!
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, pageW, pageH)
        const ratio = Math.min(pageW / img.width, (pageH - 120) / img.height)
        const iw = img.width * ratio, ih = img.height * ratio
        ctx.drawImage(img, (pageW - iw) / 2, 40, iw, ih)
        ctx.fillStyle = '#222'
        ctx.font = 'bold 24px Georgia, serif'
        const lines = pg.text.split(' ').reduce((acc: string[], w) => {
          const last = acc[acc.length - 1] || ''
          if ((last + ' ' + w).length > 40) acc.push(w); else acc[acc.length - 1] = (last + ' ' + w).trim()
          return acc
        }, [])
        lines.forEach((line, li) => ctx.fillText(line, 40, pageH - 80 + li * 28))
        pdf.addImage(c.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, pageW, pageH)
        if (i < book.pages.length - 1) pdf.addPage([pageW, pageH])
      }
      pdf.save(`${book.title.replace(/[^a-z0-9]/gi, '_')}.pdf`)
    } catch (e) {
      console.error("PDF download failed:", e)
      alert("Sorry, couldn't download PDF. Try again or check console.")
    }
  }

  const openSampleBook = (book: Book) => {
    setSelectedBook(book)
    setCurrentPageIndex(0)
  }

  return (
    <div className="min-h-screen bg-[#fffef7] overflow-hidden">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#e2e8f0]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <button
            onClick={() => setActiveSection('home')}
            className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
          >
            <div className="w-12 h-12 shrink-0 overflow-hidden rounded-xl">
              <img
                src={rbLogo}
                alt="Real Books Logo"
                className="w-full h-full object-cover object-center"
              />
            </div>
            <div>
              <div className="font-display text-2xl tracking-tight text-[#2d3748]">
                <span className="font-bold">Real</span> Books
              </div>
              <div className="text-[10px] text-[#718096] -mt-1">for real kids</div>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveSection('browse')}
              className={`px-6 py-2.5 rounded-full font-medium transition-all ${activeSection === 'browse' ? 'bg-[#f3e8ff] text-[#a855f7]' : 'hover:bg-[#f8fafc]'}`}
            >
              Browse
            </button>
            <button 
              onClick={() => setActiveSection('create')}
              className={`px-6 py-2.5 rounded-full font-medium transition-all ${activeSection === 'create' ? 'bg-[#f3e8ff] text-[#a855f7]' : 'hover:bg-[#f8fafc]'}`}
            >
              Create
            </button>
            <button 
              onClick={() => setActiveSection('mybooks')}
              className={`px-6 py-2.5 rounded-full font-medium transition-all ${activeSection === 'mybooks' ? 'bg-[#f3e8ff] text-[#a855f7]' : 'hover:bg-[#f8fafc]'}`}
            >
              My Books
            </button>
            <button 
              onClick={() => setActiveSection('community')}
              className={`px-6 py-2.5 rounded-full font-medium transition-all ${activeSection === 'community' ? 'bg-[#f3e8ff] text-[#a855f7]' : 'hover:bg-[#f8fafc]'}`}
            >
              Community
            </button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveSection('create')}
              className="btn-primary px-8 py-2.5 text-sm ml-3 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Start Creating
            </motion.button>
          </div>
        </div>
      </nav>

      {/* HOME — Unified Welcome + Create + Showcase */}
      {activeSection === 'home' && (
        <>
          {/* Welcome Banner */}
          <section className="pt-24 pb-8 bg-[#fffef7]">
            <div className="max-w-5xl mx-auto px-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white border border-[#e2e8f0] mb-6">
                <div className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse" />
                <span className="text-sm text-[#4a5568]">AI-Powered • Instant • Magical</span>
              </div>

              <h1 className="font-display text-[64px] md:text-[72px] leading-[1.05] font-medium tracking-tighter bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-x mb-4">
                What are we creating today?
              </h1>
              <p className="max-w-[560px] mx-auto text-xl text-[#4a5568] tracking-tight">
                Fill in the details below. Our AI will craft a magical story with illustrations.
              </p>
            </div>
          </section>

          {/* Input Card — Creation Form */}
          <div className="max-w-[840px] mx-auto px-6 pb-16">
            <div className="card p-10 md:p-12">
              {/* Keywords / Ideas */}
              <div className="mb-8">
                <label className="block text-sm font-semibold mb-2.5 text-[#2d3748]">
                  Keywords / Ideas <span className="text-[#a855f7]">*</span>
                </label>
                <textarea
                  className="input w-full h-[140px] resize-y min-h-[120px] text-lg"
                  placeholder={placeholderIdeas[placeholderIndex]}
                  value={formData.keywords}
                  onChange={(e) => handleInputChange('keywords', e.target.value)}
                />
                <AnimatePresence>
                  {formData.keywords.trim().length > 0 && formData.keywords.trim().split(/\s+/).length < 3 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="mt-2 text-sm text-[#e11d48] flex items-center gap-2"
                    >
                      ⚠️ Please enter at least 3 words to spark the magic.
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="text-xs text-[#94a3b8] mt-2">The more detail you give, the more magical the story!</div>
              </div>

              {/* Configuration Row */}
              <div className="flex flex-wrap gap-6">
                {/* Topic */}
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-sm font-semibold mb-2 text-[#2d3748]">Topic</label>
                  <select className="select w-full" value={formData.topic} onChange={(e) => handleInputChange('topic', e.target.value)}>
                    {topics.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                {/* Age Group */}
                <div className="flex-1 min-w-[160px]">
                  <label className="block text-sm font-semibold mb-2 text-[#2d3748]">Age Group</label>
                  <select className="select w-full" value={formData.ageGroup} onChange={(e) => handleInputChange('ageGroup', e.target.value)}>
                    {ageGroups.map(a => <option key={a} value={a}>{a} years</option>)}
                  </select>
                </div>
                {/* Page Count */}
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-sm font-semibold mb-2 text-[#2d3748]">Page Count</label>
                  <select className="select w-full" value={formData.pageCount} onChange={(e) => handleInputChange('pageCount', parseInt(e.target.value))}>
                    {pageCounts.map(p => <option key={p} value={p}>{p} pages</option>)}
                  </select>
                </div>
                {/* Illustration Style */}
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-sm font-semibold mb-2 text-[#2d3748]">Illustration Style</label>
                  <select className="select w-full" value={formData.illustrationStyle} onChange={(e) => handleInputChange('illustrationStyle', e.target.value)}>
                    {illustrationStyles.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {/* Diversity Mode */}
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-semibold mb-2 text-[#2d3748]">
                    Diversity Mode <span className="text-[#94a3b8] font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <select className="select w-full" value={formData.diversityMode} onChange={(e) => handleInputChange('diversityMode', e.target.value)}>
                      {diversityModes.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    {formData.diversityMode !== "None" && (
                      <div className="absolute -top-1 -right-1 px-2 py-0.5 bg-[#22c55e] text-white text-[10px] rounded-full">✓</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.985 }}
                onClick={handleGenerateBook}
                disabled={isGenerating || formData.keywords.trim().split(/\s+/).length < 3}
                className="btn-primary w-full mt-10 py-5 text-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 animate-pulse"
              >
                {isGenerating ? (
                  <>🪄 Creating your book… this takes a moment</>
                ) : (
                  <>✨ Generate Magic</>
                )}
              </motion.button>

              <p className="text-center text-xs text-[#94a3b8] mt-4">
                Grok AI generates the story, illustrations, and narration instantly.
              </p>
            </div>
          </div>

          {/* Transition Divider */}
          <div className="relative h-16 bg-[#fffef7] overflow-hidden">
            <svg
              className="absolute bottom-0 w-full"
              viewBox="0 0 1440 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
            >
              <path
                d="M0 40 Q360 0 720 35 Q1080 70 1440 25 L1440 80 L0 80 Z"
                fill="#f0f9ff"
              />
            </svg>
          </div>

          {/* Showcase Section with Aura Background */}
          <div className="relative pt-12 pb-16 bg-[#f0f9ff] overflow-hidden">
            {/* Subtle aura / mesh gradient */}
            <div className="absolute inset-0 pointer-events-none"
                 style={{
                   background: `
                     radial-gradient(circle at 20% 30%, rgba(192, 132, 252, 0.08) 0%, transparent 50%),
                     radial-gradient(circle at 80% 70%, rgba(165, 243, 252, 0.08) 0%, transparent 50%),
                     radial-gradient(circle at 50% 50%, rgba(167, 243, 208, 0.06) 0%, transparent 60%)
                   `
                 }}
            />
            {/* Subtle organic dot pattern */}
            <div className="absolute inset-0 pointer-events-none opacity-30"
                 style={{
                   backgroundImage: `radial-gradient(circle, #a855f7 0.5px, transparent 1px)`,
                   backgroundSize: '24px 24px'
                 }}
            />

            <div className="relative max-w-7xl mx-auto px-6">
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="uppercase tracking-[3px] text-sm font-medium text-[#a855f7] mb-1">SHOWCASE</div>
                <h2 className="font-display text-4xl font-semibold tracking-tight text-[#2d3748]">Storytime Favorites</h2>
              </div>
              <div className="text-[#718096] max-w-xs text-right text-sm">
                Tap any cover to open the story.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {sampleBooks.slice(0, 4).map((book, index) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => openSampleBook(book)}
                  className="card group cursor-pointer overflow-hidden max-w-xs mx-auto w-full"
                >
                  <div className="relative">
                    <img 
                      src={book.cover} 
                      alt={book.title}
                      className="w-full h-[280px] object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/70" />
                    <div className="absolute top-3 right-3 px-3 py-0.5 bg-white/90 backdrop-blur rounded-full text-[10px] font-medium">
                      Ages {book.ageGroup}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="font-display text-2xl tracking-tight font-semibold mb-2 text-[#2d3748] group-hover:text-[#a855f7] transition-colors line-clamp-2">
                      {book.title}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#718096] mb-4">
                      <span>{book.topic}</span>
                      <span className="w-1 h-1 rounded-full bg-[#cbd5e1]" />
                      <span>{book.style}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs flex items-center gap-1 text-[#a855f7]">
                        <Play className="w-3.5 h-3.5" /> Read story
                      </div>
                      <div className="text-[10px] px-2.5 py-0.5 bg-[#f8fafc] rounded-full text-[#718096]">
                        {book.pages.length} pages
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <button 
                onClick={() => setActiveSection('create')}
                className="btn-primary px-8 py-3 inline-flex items-center gap-2 text-sm"
              >
                Create Your Own Story <Sparkles className="w-4 h-4" />
              </button>
            </div>
            </div>
          </div>
        </>
      )}

      {/* BROWSE SECTION (standalone) with Aura Background */}
      {activeSection === 'browse' && (
        <div className="relative pt-20 pb-16 bg-[#f0f9ff] overflow-hidden">
          {/* Subtle aura / mesh gradient */}
          <div className="absolute inset-0 pointer-events-none"
               style={{
                 background: `
                   radial-gradient(circle at 20% 30%, rgba(192, 132, 252, 0.08) 0%, transparent 50%),
                   radial-gradient(circle at 80% 70%, rgba(165, 243, 252, 0.08) 0%, transparent 50%),
                   radial-gradient(circle at 50% 50%, rgba(167, 243, 208, 0.06) 0%, transparent 60%)
                 `
               }}
          />
          {/* Subtle organic dot pattern */}
          <div className="absolute inset-0 pointer-events-none opacity-30"
               style={{
                 backgroundImage: `radial-gradient(circle, #a855f7 0.5px, transparent 1px)`,
                 backgroundSize: '24px 24px'
               }}
          />
          <div className="relative max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="uppercase tracking-[3px] text-sm font-medium text-[#a855f7] mb-1">SHOWCASE</div>
              <h2 className="font-display text-4xl font-semibold tracking-tight text-[#2d3748]">Storytime Favorites</h2>
            </div>
            <div className="text-[#718096] max-w-xs text-right text-sm">
              Tap any cover to open the story.
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="mb-6 flex flex-wrap gap-3 items-center bg-white rounded-xl p-4 border border-[#e2e8f0]">
            <input
              type="text"
              placeholder="Search by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input flex-1 min-w-[200px]"
            />
            <select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)} className="select">
              <option value="">All Topics</option>
              {topics.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={ageFilter} onChange={(e) => setAgeFilter(e.target.value)} className="select">
              <option value="">All Ages</option>
              {ageGroups.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select value={styleFilter} onChange={(e) => setStyleFilter(e.target.value)} className="select">
              <option value="">All Styles</option>
              {illustrationStyles.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {(searchTerm || topicFilter || ageFilter || styleFilter) && (
              <button onClick={() => { setSearchTerm(''); setTopicFilter(''); setAgeFilter(''); setStyleFilter(''); }} className="px-3 py-2 text-sm text-[#718096] hover:text-[#2d3748]">Clear</button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...sampleBooks, ...savedBooks.filter(b => !sampleBooks.some(s => s.id === b.id))].filter(book => {
              const q = searchTerm.toLowerCase()
              const matchesSearch = !q || book.title.toLowerCase().includes(q) || book.topic.toLowerCase().includes(q)
              const matchesTopic = !topicFilter || book.topic === topicFilter
              const matchesAge = !ageFilter || book.ageGroup === ageFilter
              const matchesStyle = !styleFilter || book.style === styleFilter
              return matchesSearch && matchesTopic && matchesAge && matchesStyle
            }).slice(0, 8).map((book, index) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => openSampleBook(book)}
                className="card group cursor-pointer overflow-hidden max-w-xs mx-auto w-full"
              >
                <div className="relative">
                  <img 
                    src={book.cover} 
                    alt={book.title}
                    className="w-full h-[280px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/70" />
                  <div className="absolute top-3 right-3 px-3 py-0.5 bg-white/90 backdrop-blur rounded-full text-[10px] font-medium">
                    Ages {book.ageGroup}
                  </div>
                </div>
                <div className="p-6">
                  <div className="font-display text-2xl tracking-tight font-semibold mb-2 text-[#2d3748] group-hover:text-[#a855f7] transition-colors line-clamp-2">
                    {book.title}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#718096] mb-4">
                    <span>{book.topic}</span>
                    <span className="w-1 h-1 rounded-full bg-[#cbd5e1]" />
                    <span>{book.style}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs flex items-center gap-1 text-[#a855f7]">
                      <Play className="w-3.5 h-3.5" /> Read story
                    </div>
                    <div className="text-[10px] px-2.5 py-0.5 bg-[#f8fafc] rounded-full text-[#718096]">
                      {book.pages.length} pages
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <button 
              onClick={() => setActiveSection('create')}
              className="btn-primary px-8 py-3 inline-flex items-center gap-2 text-sm"
            >
              Create Your Own Story <Sparkles className="w-4 h-4" />
            </button>
          </div>
          </div>
        </div>
      )}

      {/* MY BOOKS SECTION */}
      {activeSection === 'mybooks' && (
        <div className="relative pt-20 pb-16 bg-[#f0f9ff] overflow-hidden">
          <div className="relative max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-8">
            <div><div className="uppercase tracking-[3px] text-sm font-medium text-[#a855f7] mb-1">LIBRARY</div><h2 className="font-display text-4xl font-semibold tracking-tight text-[#2d3748]">My Books</h2></div>
            <div className="text-[#718096] max-w-xs text-right text-sm">Your saved creations.</div>
          </div>

          {/* Filter & Search Bar */}
          <div className="mb-6 flex flex-wrap gap-3 items-center bg-white rounded-xl p-4 border border-[#e2e8f0]">
            <input
              type="text"
              placeholder="Search by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input flex-1 min-w-[200px]"
            />
            <select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)} className="select">
              <option value="">All Topics</option>
              {topics.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={ageFilter} onChange={(e) => setAgeFilter(e.target.value)} className="select">
              <option value="">All Ages</option>
              {ageGroups.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select value={styleFilter} onChange={(e) => setStyleFilter(e.target.value)} className="select">
              <option value="">All Styles</option>
              {illustrationStyles.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {(searchTerm || topicFilter || ageFilter || styleFilter) && (
              <button onClick={() => { setSearchTerm(''); setTopicFilter(''); setAgeFilter(''); setStyleFilter(''); }} className="px-3 py-2 text-sm text-[#718096] hover:text-[#2d3748]">Clear</button>
            )}
          </div>

          {savedBooks.length === 0 ? <div className="text-center py-16 text-[#718096]">No saved books yet. Generate one!</div> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {savedBooks.filter(book => {
              const q = searchTerm.toLowerCase()
              const matchesSearch = !q || book.title.toLowerCase().includes(q) || book.topic.toLowerCase().includes(q)
              const matchesTopic = !topicFilter || book.topic === topicFilter
              const matchesAge = !ageFilter || book.ageGroup === ageFilter
              const matchesStyle = !styleFilter || book.style === styleFilter
              return matchesSearch && matchesTopic && matchesAge && matchesStyle
            }).map((book, index) => (
              <motion.div key={book.id} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} onClick={() => { setSelectedBook(book); setCurrentPageIndex(0) }} className="card group cursor-pointer overflow-hidden max-w-xs mx-auto w-full">
                <div className="relative">
                  <img src={book.cover} alt={book.title} className="w-full h-[280px] object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/70" />
                  <div className="absolute top-3 left-3 px-3 py-0.5 bg-white/90 backdrop-blur rounded-full text-[10px] font-medium">Ages {book.ageGroup}</div>
                  <button
                    onClick={(e) => { e.stopPropagation(); downloadBook(book) }}
                    className="absolute top-3 right-12 w-7 h-7 flex items-center justify-center bg-black/50 hover:bg-[#a855f7] text-white rounded-full backdrop-blur transition"
                    title="Download PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSavedBooks(prev => prev.filter(b => b.id !== book.id)) }}
                    className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center bg-black/50 hover:bg-red-500/80 text-white rounded-full backdrop-blur transition"
                    title="Remove from My Books"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-6"><div className="font-display text-2xl tracking-tight font-semibold mb-2 text-[#2d3748] group-hover:text-[#a855f7] transition-colors line-clamp-2">{book.title}</div><div className="flex items-center gap-2 text-xs text-[#718096] mb-4"><span>{book.topic}</span><span className="w-1 h-1 rounded-full bg-[#cbd5e1]" /><span>{book.style}</span></div><div className="flex items-center justify-between"><div className="text-xs flex items-center gap-1 text-[#a855f7]"><Play className="w-3.5 h-3.5" /> Read</div><div className="text-[10px] px-2.5 py-0.5 bg-[#f8fafc] rounded-full text-[#718096]">{book.pages.length} pages</div></div></div>
              </motion.div>
            ))}
          </div>
          )}
          <div className="mt-10 text-center"><button onClick={() => setActiveSection('create')} className="btn-primary px-8 py-3 inline-flex items-center gap-2 text-sm">Create New <Sparkles className="w-4 h-4" /></button></div>
          </div>
        </div>
      )}

      {/* COMMUNITY SECTION */}
      {activeSection === 'community' && (
        <div className="relative pt-20 pb-16 bg-[#f0f9ff] overflow-hidden">
          <div className="relative max-w-7xl mx-auto px-6">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-[#fdf4ff] text-[#a855f7] text-sm mb-4">
                👥 Community
              </div>
              <h2 className="font-display text-6xl font-semibold tracking-tighter text-[#2d3748] mb-3">Community</h2>
              <p className="text-xl text-[#4a5568] max-w-xl mx-auto">
                Share your creations, rate and comment on others' books, discuss stories, and even sell your best work to the community.
              </p>
            </div>

            {/* Mock Community Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {/* Share */}
              <div className="card p-6">
                <div className="text-4xl mb-3">🌐</div>
                <div className="font-display text-2xl font-semibold mb-2 text-[#2d3748]">Share Your Books</div>
                <p className="text-[#4a5568] text-sm">Publish your favorite creations to the community gallery. Inspire other families and educators.</p>
              </div>
              {/* Rate & Comment */}
              <div className="card p-6">
                <div className="text-4xl mb-3">⭐</div>
                <div className="font-display text-2xl font-semibold mb-2 text-[#2d3748]">Rate & Comment</div>
                <p className="text-[#4a5568] text-sm">Leave stars and thoughtful comments on books you love. Help creators improve their stories.</p>
              </div>
              {/* Discussion */}
              <div className="card p-6">
                <div className="text-4xl mb-3">💬</div>
                <div className="font-display text-2xl font-semibold mb-2 text-[#2d3748]">Discussion & Ideas</div>
                <p className="text-[#4a5568] text-sm">Chat with parents and teachers. Share prompts, tips, and fun story ideas for kids.</p>
              </div>
            </div>

            {/* Sample Community Book Cards */}
            <div className="mb-8">
              <div className="uppercase tracking-[3px] text-sm font-medium text-[#a855f7] mb-4 text-center">Community Gallery (Preview)</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="card group overflow-hidden max-w-xs mx-auto w-full opacity-70">
                    <div className="relative">
                      <div className="w-full h-[220px] bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-6xl">📖</div>
                      <div className="absolute top-3 right-3 px-3 py-0.5 bg-white/90 rounded-full text-[10px] font-medium">★ {4 + (i%2)}</div>
                    </div>
                    <div className="p-5">
                      <div className="font-display text-xl font-semibold mb-1 text-[#2d3748]">Community Story #{i}</div>
                      <div className="text-xs text-[#718096] mb-3">by Parent • Ages 3-4 • 4 pages</div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#a855f7]">💬 12 comments</span>
                        <span className="text-[#22c55e]">❤️ 48</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center text-sm text-[#718096]">This is a preview of upcoming features — real interactions coming soon!</div>
            <div className="mt-8 text-center"><button onClick={() => setActiveSection('create')} className="btn-primary px-8 py-3 inline-flex items-center gap-2 text-sm">Create Your Own Story <Sparkles className="w-4 h-4" /></button></div>
          </div>
        </div>
      )}

      {/* CREATE SECTION — Creation Hub */}
      {activeSection === 'create' && (
        <div className="pt-24 pb-24 max-w-[840px] mx-auto px-6">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-[#fdf4ff] text-[#a855f7] text-sm mb-4">
              <Sparkles className="w-4 h-4" /> Creation Hub
            </div>
            <h2 className="font-display text-6xl font-semibold tracking-tighter text-[#2d3748] mb-3">
              Design Your Picture Book
            </h2>
            <p className="text-xl text-[#4a5568]">Fill in the details below. Our AI will craft a magical story with illustrations.</p>
          </div>

          {/* Central Input Card */}
          <div className="card p-10 md:p-12">
            {/* Keywords / Ideas — Large textarea with validation */}
            <div className="mb-8">
              <label className="block text-sm font-semibold mb-2.5 text-[#2d3748]">
                Keywords / Ideas <span className="text-[#a855f7]">*</span>
              </label>
              <textarea
                className="input w-full h-[140px] resize-y min-h-[120px] text-lg"
                placeholder={placeholderIdeas[placeholderIndex]}
                value={formData.keywords}
                onChange={(e) => handleInputChange('keywords', e.target.value)}
              />
              {/* Validation message */}
              <AnimatePresence>
                {formData.keywords.trim().length > 0 && formData.keywords.trim().split(/\s+/).length < 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="mt-2 text-sm text-[#e11d48] flex items-center gap-2"
                  >
                    ⚠️ Please enter at least 3 words to spark the magic.
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="text-xs text-[#94a3b8] mt-2">The more detail you give, the more magical the story!</div>
            </div>

            {/* Configuration Row — flex-wrap of styled dropdowns */}
            <div className="flex flex-wrap gap-6">
              {/* Topic */}
              <div className="flex-1 min-w-[180px]">
                <label className="block text-sm font-semibold mb-2 text-[#2d3748]">Topic</label>
                <select
                  className="select w-full"
                  value={formData.topic}
                  onChange={(e) => handleInputChange('topic', e.target.value)}
                >
                  {topics.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Age Group */}
              <div className="flex-1 min-w-[160px]">
                <label className="block text-sm font-semibold mb-2 text-[#2d3748]">Age Group</label>
                <select
                  className="select w-full"
                  value={formData.ageGroup}
                  onChange={(e) => handleInputChange('ageGroup', e.target.value)}
                >
                  {ageGroups.map(a => <option key={a} value={a}>{a} years</option>)}
                </select>
              </div>

              {/* Page Count */}
              <div className="flex-1 min-w-[140px]">
                <label className="block text-sm font-semibold mb-2 text-[#2d3748]">Page Count</label>
                <select
                  className="select w-full"
                  value={formData.pageCount}
                  onChange={(e) => handleInputChange('pageCount', parseInt(e.target.value))}
                >
                  {pageCounts.map(p => <option key={p} value={p}>{p} pages</option>)}
                </select>
              </div>

              {/* Illustration Style */}
              <div className="flex-1 min-w-[180px]">
                <label className="block text-sm font-semibold mb-2 text-[#2d3748]">Illustration Style</label>
                <select
                  className="select w-full"
                  value={formData.illustrationStyle}
                  onChange={(e) => handleInputChange('illustrationStyle', e.target.value)}
                >
                  {illustrationStyles.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Diversity Mode — Optional toggle-style dropdown */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-semibold mb-2 text-[#2d3748]">
                  Diversity Mode <span className="text-[#94a3b8] font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <select
                    className="select w-full"
                    value={formData.diversityMode}
                    onChange={(e) => handleInputChange('diversityMode', e.target.value)}
                  >
                    {diversityModes.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {formData.diversityMode !== "None" && (
                    <div className="absolute -top-1 -right-1 px-2 py-0.5 bg-[#22c55e] text-white text-[10px] rounded-full">✓</div>
                  )}
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.985 }}
              onClick={handleGenerateBook}
              disabled={isGenerating || formData.keywords.trim().split(/\s+/).length < 3}
              className="btn-primary w-full mt-10 py-5 text-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isGenerating ? (
                <>🪄 Creating your book… this takes a moment</>
              ) : (
                <>✨ Generate Magic</>
              )}
            </motion.button>

            <p className="text-center text-xs text-[#94a3b8] mt-4">
              Grok AI generates the story, illustrations, and narration instantly.
            </p>
          </div>
        </div>
      )}

      {/* FLOATING GALLERY BOOK MODAL */}
      <AnimatePresence>
        {selectedBook && (
          <div 
            className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 md:p-8"
            onClick={closeModal}
            onDoubleClick={stopSpeaking}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative bg-black rounded-3xl overflow-hidden shadow-2xl
                         w-[82vw] max-w-[1200px] aspect-[16/10]"
              onClick={e => e.stopPropagation()}
            >
              {/* 3D Page-Flip Canvas */}
              <div className="absolute inset-0" style={{ perspective: '2000px' }}>
                {isFlipping && flipDirection ? (
                  /* Flipping: show outgoing page rotating, incoming page behind */
                  <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
                    {/* Incoming page (behind, revealed as outgoing flips) */}
                    <div className="absolute inset-0 overflow-hidden">
                      <img 
                        src={selectedBook.pages[
                          flipDirection === 'next' 
                            ? Math.min(currentPageIndex + 1, selectedBook.pages.length - 1)
                            : Math.max(currentPageIndex - 1, 0)
                        ].illustration}
                        alt="incoming"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />
                    </div>

                    {/* Outgoing page (flipping away) */}
                    <div 
                      className="absolute inset-0 overflow-hidden transition-transform duration-[650ms] ease-out"
                      style={{
                        transformOrigin: 'left center',
                        transform: flipDirection === 'next' 
                          ? 'rotateY(-170deg)' 
                          : 'rotateY(170deg)',
                        transformStyle: 'preserve-3d',
                        boxShadow: '-20px 0 40px rgba(0,0,0,0.5)',
                      }}
                    >
                      <img 
                        src={selectedBook.pages[currentPageIndex].illustration}
                        alt={`Page ${selectedBook.pages[currentPageIndex].pageNum}`}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      {/* Page thickness gradient on the "edge" */}
                      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
                      {/* Vignette on outgoing page */}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />

                      {/* Corner curl elements - top-right */}
                      <div 
                        className="absolute top-0 right-0 w-24 h-24 pointer-events-none"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, transparent 60%)',
                          transform: flipDirection === 'next' 
                            ? 'rotate(-25deg) translate(10px, -10px)' 
                            : 'rotate(25deg) translate(-10px, -10px)',
                          transition: 'transform 650ms ease-out',
                        }}
                      />
                      {/* Corner curl elements - bottom-right */}
                      <div 
                        className="absolute bottom-0 right-0 w-24 h-24 pointer-events-none"
                        style={{
                          background: 'linear-gradient(-45deg, rgba(255,255,255,0.35) 0%, transparent 60%)',
                          transform: flipDirection === 'next' 
                            ? 'rotate(25deg) translate(10px, 10px)' 
                            : 'rotate(-25deg) translate(-10px, 10px)',
                          transition: 'transform 650ms ease-out',
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  /* Normal (not flipping): just show current page */
                  <>
                    <img 
                      src={selectedBook.pages[currentPageIndex].illustration}
                      alt={`Page ${selectedBook.pages[currentPageIndex].pageNum}`}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />
                  </>
                )}
              </div>

              {/* Context-aware Text Overlay */}
              {(() => {
                const positions = [
                  'bottom-12 left-12 max-w-[420px]',   // lower-left
                  'bottom-12 right-12 max-w-[420px]',  // lower-right
                  'top-16 left-1/2 -translate-x-1/2 max-w-[520px] text-center', // top-center
                  'top-20 right-12 max-w-[380px]',     // upper-right
                ];
                const pos = positions[currentPageIndex % positions.length];
                return (
                  <div className={`absolute ${pos} z-10`}>
                    <div 
                      className="text-white text-3xl md:text-[34px] leading-snug tracking-[-0.01em]"
                      style={{ 
                        fontFamily: "'Georgia', 'Times New Roman', 'Baskerville', serif",
                        textShadow: '0 1px 3px rgba(0,0,0,0.75), 0 3px 8px rgba(0,0,0,0.45)'
                      }}
                    >
                      {selectedBook.pages[currentPageIndex].text}
                    </div>
                  </div>
                );
              })()}

              {/* Page Indicator */}
              <div className="absolute top-6 right-6 bg-black/50 text-white text-sm px-4 py-1.5 rounded-full backdrop-blur flex items-center gap-2 z-20">
                <span>Page</span>
                <span className="font-medium">{currentPageIndex + 1}</span>
                <span className="opacity-60">/</span>
                <span className="opacity-80">{selectedBook.pages.length}</span>
              </div>

              {/* Book Title (top-left) */}
              <div className="absolute top-6 left-6 z-20">
                <div className="font-display text-white text-xl font-semibold tracking-tight drop-shadow">{selectedBook.title}</div>
                <div className="text-white/70 text-xs mt-0.5">{selectedBook.ageGroup} • {selectedBook.style}</div>
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={prevPage}
                disabled={currentPageIndex === 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 text-white disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur transition"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextPage}
                disabled={currentPageIndex === selectedBook.pages.length - 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 text-white disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur transition"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              {/* Bottom Bar: Close + Save + Listen */}
              <div className="absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-black/70 to-transparent px-8 py-6 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={closeModal}
                    className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur transition flex items-center gap-2 text-sm"
                  >
                    <X className="w-4 h-4" /> Close
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      if (!selectedBook) return
                      setSavedBooks(prev => {
                        const idx = prev.findIndex(b => b.id === selectedBook.id)
                        if (idx !== -1) {
                          // Replace existing (update to latest regenerated version)
                          const updated = [...prev]
                          updated[idx] = selectedBook
                          return updated
                        }
                        // New book — add to front
                        return [selectedBook, ...prev]
                      })
                    }}
                    className={`px-5 py-2 rounded-full backdrop-blur transition flex items-center gap-2 text-sm ${selectedBook && savedBooks.some(b => b.id === selectedBook.id) ? 'bg-green-500/80 text-white' : 'bg-white/10 hover:bg-white/20'}`}
                  >
                    {selectedBook && savedBooks.some(b => b.id === selectedBook.id) ? '✓ Saved' : '💾 Save'}
                  </button>
                  <button 
                    onClick={handleRegenerateBook}
                    disabled={isGenerating || savedBooks.some(b => b.id === selectedBook?.id) || sampleBooks.some(b => b.id === selectedBook?.id)}
                    className="px-5 py-2 rounded-full backdrop-blur transition flex items-center gap-2 text-sm bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    🔄 Regenerate
                  </button>
                  <button 
                    onClick={speak}
                    className={`px-5 py-2 rounded-full backdrop-blur transition flex items-center gap-2 text-sm ${currentAudio && !currentAudio.paused ? 'bg-red-500/80 text-white' : 'bg-white/10 hover:bg-white/20'}`}
                  >
                    {currentAudio && !currentAudio.paused ? '⏹ Stop' : '🔊 Listen'}
                  </button>
                </div>
              </div>


            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Grok Simulation — Beautiful Loading Overlay */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-[#fffef7]/95 backdrop-blur-lg"
          >
            <div className="text-center px-6">
              {/* Animated Book + Pencil */}
              <div className="relative mx-auto w-28 h-28 mb-10">
                <motion.div
                  animate={{ rotate: [0, 8, -6, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 flex items-center justify-center text-7xl"
                >
                  📖
                </motion.div>
                <motion.div
                  animate={{ 
                    x: [-14, 18, -14],
                    y: [-8, 10, -8],
                    rotate: [-25, 18, -25]
                  }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-2 -right-3 text-5xl"
                >
                  ✏️
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-4xl"
                >
                  🎨
                </motion.div>
              </div>

              <h3 className="font-display text-4xl tracking-tight text-[#2d3748] mb-3">Writing & Drawing…</h3>
              <p className="text-xl text-[#4a5568] max-w-sm mx-auto">Grok is crafting a magical story and beautiful illustrations just for you.</p>

              {/* Animated dots */}
              <div className="flex justify-center gap-2 mt-8">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#a855f7] to-[#ec4899]"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App

