import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Upload, Check, X } from 'lucide-react';
import { useSiteSettings } from '@/lib/site-settings';
import AdminModal from '@/components/admin/AdminModal';
import ThemeCard from '@/components/admin/homepage/ThemeCard';
import DevicePreview from '@/components/admin/homepage/DevicePreview';
import Slider from '@/components/admin/homepage/Slider';
import ColorPicker from '@/components/admin/homepage/ColorPicker';
import MenuSectionEditor from '@/components/admin/homepage/MenuSectionEditor';

export default function HomepageEditor() {
  const queryClient = useQueryClient();
  const { data: settings } = useSiteSettings();
  const { data: themes = [], isLoading: themesLoading } = useQuery({
    queryKey: ['homepageThemes'],
    queryFn: () => base44.entities.HomepageTheme.list('sort_order', 50),
  });
  const { data: menuSections = [] } = useQuery({
    queryKey: ['menuSections'],
    queryFn: () => base44.entities.MenuSection.list('sort_order', 50),
  });
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('sort_order', 200),
  });

  const [selectedThemeId, setSelectedThemeId] = useState(null);
  const [form, setForm] = useState(null);
  const [siteForm, setSiteForm] = useState(null);
  const [activeDevice, setActiveDevice] = useState('desktop');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingAbout, setUploadingAbout] = useState(false);
  const [renamingTheme, setRenamingTheme] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    if (themes.length > 0 && !selectedThemeId) {
      const activeId = settings?.active_theme_id;
      const active = themes.find(t => t.id === activeId) || themes[0];
      setSelectedThemeId(active.id);
      setForm({ ...active });
    }
  }, [themes, settings, selectedThemeId]);

  useEffect(() => {
    if (settings) {
      setSiteForm({
        about_title: settings.about_title || '',
        about_text: settings.about_text || '',
        about_images: settings.about_images || [],
        why_choose_us_title: settings.why_choose_us_title || '',
        why_choose_us_text: settings.why_choose_us_text || '',
      });
    }
  }, [settings]);

  const selectTheme = (theme) => {
    setSelectedThemeId(theme.id);
    setForm({ ...theme });
  };

  const update = (field, value) => setForm(prev => prev ? { ...prev, [field]: value } : prev);
  const updateSite = (field, value) => setSiteForm(prev => prev ? { ...prev, [field]: value } : prev);

  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      update('hero_image', file_url);
    } catch (err) {
      alert('Upload failed: ' + (err.message || 'Unknown error'));
    }
    setUploading(false);
  };

  const handleAboutImageUpload = async (file) => {
    if (!file) return;
    setUploadingAbout(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      updateSite('about_images', [...(siteForm.about_images || []), file_url]);
    } catch (err) {
      alert('Upload failed: ' + (err.message || 'Unknown error'));
    }
    setUploadingAbout(false);
  };

  const removeAboutImage = (index) => {
    updateSite('about_images', (siteForm.about_images || []).filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (form?.id) {
        await base44.entities.HomepageTheme.update(form.id, form);
      }
      const siteData = { ...siteForm, active_theme_id: selectedThemeId };
      if (settings?.id) {
        await base44.entities.SiteSettings.update(settings.id, siteData);
      } else {
        await base44.entities.SiteSettings.create(siteData);
      }
      queryClient.invalidateQueries(['siteSettings']);
      queryClient.invalidateQueries(['homepageThemes']);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Save failed: ' + (err.message || 'Unknown error'));
    }
    setSaving(false);
  };

  const duplicateTheme = async (theme) => {
    try {
      const { id, created_date, updated_date, created_by_id, ...themeData } = theme;
      await base44.entities.HomepageTheme.create({
        ...themeData,
        name: `${theme.name} (Copy)`,
        is_builtin: false,
        sort_order: themes.length,
      });
      queryClient.invalidateQueries(['homepageThemes']);
    } catch (err) {
      alert('Duplicate failed: ' + (err.message || 'Unknown error'));
    }
  };

  const startRename = (theme) => {
    setRenamingTheme(theme);
    setRenameValue(theme.name);
  };

  const confirmRename = async () => {
    if (!renamingTheme || !renameValue.trim()) return;
    try {
      await base44.entities.HomepageTheme.update(renamingTheme.id, { name: renameValue.trim() });
      queryClient.invalidateQueries(['homepageThemes']);
      if (selectedThemeId === renamingTheme.id && form) {
        setForm({ ...form, name: renameValue.trim() });
      }
    } catch (err) {
      alert('Rename failed: ' + (err.message || 'Unknown error'));
    }
    setRenamingTheme(null);
  };

  const deleteTheme = async (theme) => {
    if (theme.is_builtin) return;
    if (!window.confirm(`Delete "${theme.name}"? This cannot be undone.`)) return;
    try {
      await base44.entities.HomepageTheme.delete(theme.id);
      queryClient.invalidateQueries(['homepageThemes']);
      if (selectedThemeId === theme.id) {
        setSelectedThemeId(null);
        setForm(null);
      }
    } catch (err) {
      alert('Delete failed: ' + (err.message || 'Unknown error'));
    }
  };

  if (themesLoading || !form || !siteForm) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold">Homepage Editor</h1>
          <p className="text-muted-foreground mt-1">Click a theme to load it. Preview updates instantly — save to publish.</p>
        </div>
        {saved && (
          <span className="flex items-center gap-2 text-success font-label text-sm">
            <Check className="w-4 h-4" /> Saved!
          </span>
        )}
      </div>

      {/* Theme Cards */}
      <div className="bg-card rounded-2xl shadow-warm-sm p-5 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {themes.map(theme => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isSelected={selectedThemeId === theme.id}
              onSelect={selectTheme}
              onEdit={selectTheme}
              onDuplicate={duplicateTheme}
              onRename={startRename}
              onDelete={deleteTheme}
            />
          ))}
        </div>
      </div>

      {/* Two-column: controls + preview */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
        {/* Controls — scrollable */}
        <div className="space-y-5">
          {/* Homepage Banner */}
          <div className="bg-card rounded-2xl shadow-warm-sm p-5">
            <h2 className="font-heading text-lg font-bold mb-4">Homepage Banner</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                  {form.hero_image ? (
                    <img src={form.hero_image} alt="Banner" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer text-sm font-label">
                    {uploading ? (
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    Upload Image
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e.target.files?.[0])} />
                  </label>
                  {form.hero_image && (
                    <button onClick={() => update('hero_image', '')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-xs font-label">
                      <X className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>
              </div>

              <Slider label="Horizontal Position" value={form.hero_image_x ?? 50} min={0} max={100} onChange={v => update('hero_image_x', v)} suffix="%" />
              <Slider label="Vertical Position" value={form.hero_image_y ?? 50} min={0} max={100} onChange={v => update('hero_image_y', v)} suffix="%" />
              <Slider label="Image Zoom" value={form.hero_image_zoom ?? 100} min={100} max={300} step={5} onChange={v => update('hero_image_zoom', v)} suffix="%" />
              <Slider label="Overlay Opacity" value={form.hero_overlay_darkness ?? 30} min={0} max={100} onChange={v => update('hero_overlay_darkness', v)} suffix="%" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-label text-xs text-muted-foreground block mb-2">Banner Height</label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { value: 'small', label: 'S' },
                      { value: 'medium', label: 'M' },
                      { value: 'large', label: 'L' },
                      { value: 'full_screen', label: 'XL' },
                    ].map(opt => (
                      <button key={opt.value} onClick={() => update('hero_height', opt.value)}
                        className={`px-3 py-1.5 rounded-lg font-label text-xs transition-colors ${form.hero_height === opt.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-primary/10'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="font-label text-xs text-muted-foreground block mb-2">Text Position</label>
                  <div className="flex flex-wrap gap-1.5">
                    {[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }].map(opt => (
                      <button key={opt.value} onClick={() => update('hero_text_position', opt.value)}
                        className={`px-3 py-1.5 rounded-lg font-label text-xs transition-colors ${form.hero_text_position === opt.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-primary/10'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Banner Text */}
          <div className="bg-card rounded-2xl shadow-warm-sm p-5">
            <h2 className="font-heading text-lg font-bold mb-4">Banner Text</h2>
            <div className="space-y-4">
              <div>
                <label className="font-label text-xs text-muted-foreground block mb-1.5">Title</label>
                <textarea value={form.hero_headline || ''} onChange={e => update('hero_headline', e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-sm" rows="2" />
              </div>
              <div>
                <label className="font-label text-xs text-muted-foreground block mb-1.5">Subtitle</label>
                <textarea value={form.hero_subheadline || ''} onChange={e => update('hero_subheadline', e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-sm" rows="2" />
              </div>
              <div>
                <label className="font-label text-xs text-muted-foreground block mb-1.5">Button Text</label>
                <input type="text" value={form.hero_cta_text || ''} onChange={e => update('hero_cta_text', e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-sm" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Slider label="Title Size" value={form.hero_title_size ?? 1} min={0.5} max={2} step={0.1} onChange={v => update('hero_title_size', v)} suffix="x" />
                <Slider label="Subtitle Size" value={form.hero_subtitle_size ?? 1} min={0.5} max={2} step={0.1} onChange={v => update('hero_subtitle_size', v)} suffix="x" />
                <Slider label="Button Size" value={form.hero_button_text_size ?? 1} min={0.5} max={2} step={0.1} onChange={v => update('hero_button_text_size', v)} suffix="x" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <ColorPicker label="Title Color" value={form.hero_title_color || ''} onChange={v => update('hero_title_color', v)} />
                <ColorPicker label="Subtitle Color" value={form.hero_subtitle_color || ''} onChange={v => update('hero_subtitle_color', v)} />
                <ColorPicker label="Button Color" value={form.hero_button_color || ''} onChange={v => update('hero_button_color', v)} />
                <ColorPicker label="Button Text Color" value={form.hero_button_text_color || ''} onChange={v => update('hero_button_text_color', v)} />
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="bg-card rounded-2xl shadow-warm-sm p-5">
            <h2 className="font-heading text-lg font-bold mb-4">About Section</h2>
            <div className="space-y-4">
              <div>
                <label className="font-label text-xs text-muted-foreground block mb-1.5">Title</label>
                <input type="text" value={siteForm.about_title || ''} onChange={e => updateSite('about_title', e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-sm" />
              </div>
              <div>
                <label className="font-label text-xs text-muted-foreground block mb-1.5">Text</label>
                <textarea value={siteForm.about_text || ''} onChange={e => updateSite('about_text', e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-sm" rows="4" />
              </div>
              <div>
                <label className="font-label text-xs text-muted-foreground block mb-1.5">Gallery Images (auto-rotating)</label>
                <div className="flex flex-wrap gap-2">
                  {(siteForm.about_images || []).map((img, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden bg-secondary">
                      <img src={img} alt={`About ${i + 1}`} className="w-full h-full object-cover" />
                      <button onClick={() => removeAboutImage(i)} className="absolute top-0.5 right-0.5 bg-foreground/60 text-background p-0.5 rounded-full">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <label className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    {uploadingAbout ? (
                      <div className="w-5 h-5 border-2 border-secondary border-t-primary rounded-full animate-spin"></div>
                    ) : (
                      <Upload className="w-4 h-4 text-muted-foreground" />
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleAboutImageUpload(e.target.files?.[0])} />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Why Choose Us */}
          <div className="bg-card rounded-2xl shadow-warm-sm p-5">
            <h2 className="font-heading text-lg font-bold mb-4">Why Choose Us</h2>
            <div className="space-y-4">
              <div>
                <label className="font-label text-xs text-muted-foreground block mb-1.5">Title</label>
                <input type="text" value={siteForm.why_choose_us_title || ''} onChange={e => updateSite('why_choose_us_title', e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-sm" />
              </div>
              <div>
                <label className="font-label text-xs text-muted-foreground block mb-1.5">Text</label>
                <textarea value={siteForm.why_choose_us_text || ''} onChange={e => updateSite('why_choose_us_text', e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-sm" rows="3" />
              </div>
            </div>
          </div>

          {/* Additional Menus */}
          <MenuSectionEditor />

          <button onClick={handleSave} disabled={saving}
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-full font-label hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? (
              <><div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div> Saving...</>
            ) : (
              <><Check className="w-4 h-4" /> Save Changes</>
            )}
          </button>
        </div>

        {/* Live Preview — sticky */}
        <div className="xl:sticky xl:top-8 xl:self-start xl:max-h-[calc(100vh-2rem)] flex flex-col">
          <div className="bg-card rounded-2xl shadow-warm-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading text-lg font-bold">Live Preview</h2>
              <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
                {[{ key: 'desktop', label: 'Desk' }, { key: 'tablet', label: 'Tab' }, { key: 'mobile', label: 'Mob' }].map(d => (
                  <button key={d.key} onClick={() => setActiveDevice(d.key)}
                    className={`px-2.5 py-1 rounded-md font-label text-xs transition-colors ${activeDevice === d.key ? 'bg-card text-primary shadow-warm-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-center bg-secondary/30 rounded-xl py-4">
              <DevicePreview form={form} siteForm={siteForm} menuSections={menuSections} products={products} device={activeDevice} />
            </div>
          </div>
        </div>
      </div>

      {/* Rename Modal */}
      <AdminModal open={!!renamingTheme} onClose={() => setRenamingTheme(null)} title="Rename Theme" maxWidth="max-w-sm">
        <div className="space-y-4">
          <input
            type="text"
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && confirmRename()}
          />
          <div className="flex gap-3">
            <button onClick={() => setRenamingTheme(null)} className="flex-1 py-3 rounded-full bg-secondary text-foreground font-label text-sm hover:opacity-90 transition-opacity">Cancel</button>
            <button onClick={confirmRename} className="flex-1 py-3 rounded-full bg-primary text-primary-foreground font-label text-sm hover:opacity-90 transition-opacity">Rename</button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}