import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Color Palette - Clean, Modern Engineering (Zero AI Cliché)
    C_NAVY     = RGBColor(15, 23, 42)     # #0F172A - Deep Slate/Navy for headers
    C_EMERALD  = RGBColor(5, 150, 105)    # #059669 - Agritech Emerald Accent
    C_BG       = RGBColor(248, 250, 252)  # #F8FAFC - Off-white canvas
    C_CARD_BG  = RGBColor(255, 255, 255)  # #FFFFFF - Crisp white cards
    C_CARD_BD  = RGBColor(226, 232, 240)  # #E2E8F0 - Subtle slate border
    C_TEXT     = RGBColor(51, 65, 85)     # #334155 - Slate body text
    C_MUTED    = RGBColor(100, 116, 139)  # #64748B - Subtext / captions
    C_LIGHT_EM = RGBColor(236, 253, 245)  # Light green tint for badges

    def add_base_decorations(slide, page_num, title_text, category_badge=None):
        # Background fill
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = C_BG
        bg.line.fill.background()

        # Top Header Area
        # Left Team Badge
        tb = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(0.4), Inches(2.2), Inches(0.55))
        tb.fill.solid()
        tb.fill.fore_color.rgb = C_LIGHT_EM
        tb.line.color.rgb = C_EMERALD
        tf = tb.text_frame
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        run = p.add_run()
        run.text = "YOUR TEAM NAME"
        run.font.name = "Arial"
        run.font.size = Pt(11)
        run.font.bold = True
        run.font.color.rgb = C_EMERALD

        # Right SIH Badge
        sb = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(10.2), Inches(0.4), Inches(2.5), Inches(0.55))
        sb.fill.solid()
        sb.fill.fore_color.rgb = RGBColor(241, 245, 249)
        sb.line.color.rgb = C_CARD_BD
        tf_s = sb.text_frame
        tf_s.vertical_anchor = MSO_ANCHOR.MIDDLE
        p_s = tf_s.paragraphs[0]
        p_s.alignment = PP_ALIGN.CENTER
        run_s = p_s.add_run()
        run_s.text = "SMART INDIA HACKATHON 2026"
        run_s.font.name = "Arial"
        run_s.font.size = Pt(9.5)
        run_s.font.bold = True
        run_s.font.color.rgb = C_NAVY

        # Main Slide Title
        tbox = slide.shapes.add_textbox(Inches(0.6), Inches(1.05), Inches(12.133), Inches(0.7))
        t_frame = tbox.text_frame
        t_frame.word_wrap = True
        p_t = t_frame.paragraphs[0]
        r_t = p_t.add_run()
        r_t.text = title_text
        r_t.font.name = "Arial"
        r_t.font.size = Pt(22)
        r_t.font.bold = True
        r_t.font.color.rgb = C_NAVY

        # Accent Line
        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.6), Inches(1.75), Inches(2.0), Inches(0.04))
        line.fill.solid()
        line.fill.fore_color.rgb = C_EMERALD
        line.line.fill.background()

        # Footer
        fbox = slide.shapes.add_textbox(Inches(0.6), Inches(7.05), Inches(12.133), Inches(0.35))
        f_frame = fbox.text_frame
        p_f = f_frame.paragraphs[0]
        r_f = p_f.add_run()
        r_f.text = f"@SIH Idea submission- Template {page_num}"
        r_f.font.name = "Arial"
        r_f.font.size = Pt(9)
        r_f.font.color.rgb = C_MUTED

    # =========================================================================
    # SLIDE 1: TITLE PAGE
    # =========================================================================
    slide1 = prs.slides.add_slide(blank_layout)
    bg1 = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = C_BG
    bg1.line.fill.background()

    # Top SIH Header
    head_box = slide1.shapes.add_textbox(Inches(0.8), Inches(0.5), Inches(11.733), Inches(0.6))
    p_h = head_box.text_frame.paragraphs[0]
    p_h.alignment = PP_ALIGN.CENTER
    r_h = p_h.add_run()
    r_h.text = "SMART INDIA HACKATHON 2026"
    r_h.font.name = "Arial"
    r_h.font.size = Pt(28)
    r_h.font.bold = True
    r_h.font.color.rgb = C_NAVY

    sub_h = slide1.shapes.add_textbox(Inches(0.8), Inches(1.15), Inches(11.733), Inches(0.45))
    p_sub = sub_h.text_frame.paragraphs[0]
    p_sub.alignment = PP_ALIGN.CENTER
    r_sub = p_sub.add_run()
    r_sub.text = "TITLE PAGE"
    r_sub.font.name = "Arial"
    r_sub.font.size = Pt(20)
    r_sub.font.bold = True
    r_sub.font.color.rgb = C_EMERALD

    # Left Container for Project Metadata
    left_card = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.9), Inches(7.2), Inches(5.1))
    left_card.fill.solid()
    left_card.fill.fore_color.rgb = C_CARD_BG
    left_card.line.color.rgb = C_CARD_BD
    tf_meta = left_card.text_frame
    tf_meta.word_wrap = True

    fields = [
        ("Problem Statement ID", "SIH109 / 1642 (Check your exact ID on portal)"),
        ("Problem Statement Title", "Early Detection and Prevention of Bovine Mastitis in Dairy Cattle"),
        ("Theme", "Agriculture, FoodTech & Rural Development / IoT / MedTech"),
        ("PS Category", "Hardware (IoT Edge Computing, Wireless DSP & Multi-Sensor Cloud)"),
        ("Team ID", "[Enter your Team ID from portal]"),
        ("Team Name", "[Enter your Registered Team Name]"),
        ("Proposed Project Name", "LactoGuard (DhenuRakshak AI) — Low-Cost Herd Health & Mastitis Early Warning")
    ]

    for i, (k, v) in enumerate(fields):
        p = tf_meta.paragraphs[0] if i == 0 else tf_meta.add_paragraph()
        p.space_after = Pt(8)
        rk = p.add_run()
        rk.text = f"• {k}: "
        rk.font.name = "Arial"
        rk.font.size = Pt(13)
        rk.font.bold = True
        rk.font.color.rgb = C_NAVY
        rv = p.add_run()
        rv.text = v
        rv.font.name = "Arial"
        rv.font.size = Pt(12.5)
        rv.font.color.rgb = C_TEXT

    # Right Hero Card
    right_card = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.3), Inches(1.9), Inches(4.2), Inches(5.1))
    right_card.fill.solid()
    right_card.fill.fore_color.rgb = C_LIGHT_EM
    right_card.line.color.rgb = C_EMERALD
    tf_rc = right_card.text_frame
    tf_rc.word_wrap = True

    p_rt = tf_rc.paragraphs[0]
    p_rt.alignment = PP_ALIGN.CENTER
    r_rt = p_rt.add_run()
    r_rt.text = "LACTOGUARD ECOSYSTEM\n\n"
    r_rt.font.name = "Arial"
    r_rt.font.size = Pt(16)
    r_rt.font.bold = True
    r_rt.font.color.rgb = C_NAVY

    features = [
        "🐄 Smart Ear Tag Node\n(ADXL345 50Hz DSP + LM35 Body Temp)",
        "🥛 Handheld Bucket Meter\n(MFRC522 RFID + Milk EC + Milk pH)",
        "⚡ Zero-Pi Central Gateway\n(ESP-NOW Multi-Node Receiver < 5ms)",
        "☁️ Cloud Diagnostic Engine\n(7–14 Day Pre-Clinical Prediction)",
        "💰 Total System Cost: < ₹2,000\n(vs ₹45,000+ Commercial Collars)"
    ]
    for feat in features:
        pf = tf_rc.add_paragraph()
        pf.space_after = Pt(10)
        rf = pf.add_run()
        rf.text = "✓ " + feat
        rf.font.name = "Arial"
        rf.font.size = Pt(12)
        rf.font.color.rgb = C_TEXT

    # =========================================================================
    # SLIDE 2: PROPOSED SOLUTION
    # =========================================================================
    slide2 = prs.slides.add_slide(blank_layout)
    add_base_decorations(slide2, 2, "PROPOSED SOLUTION (Idea / Solution / Prototype)")

    # 3 Cards Layout
    card_w = Inches(3.8)
    card_h = Inches(4.9)

    # Card 1: Problem Ground Reality
    c1 = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(1.95), card_w, card_h)
    c1.fill.solid()
    c1.fill.fore_color.rgb = C_CARD_BG
    c1.line.color.rgb = C_CARD_BD
    t1 = c1.text_frame
    t1.word_wrap = True
    p1 = t1.paragraphs[0]
    r1 = p1.add_run()
    r1.text = "1. Problem & Ground Reality\n"
    r1.font.bold = True
    r1.font.size = Pt(15)
    r1.font.color.rgb = RGBColor(225, 29, 72) # Rose accent

    c1_bullets = [
        ("₹13,000+ Cr National Loss:", " ICAR-NDRI field data shows mastitis costs Indian dairy >₹13,000 Cr/yr (~₹7,165/cow/yr)."),
        ("Silent Subclinical Epidemic:", " 40%–50% of lactating cattle suffer from subclinical mastitis with zero visible udder swelling."),
        ("Smallholder Exclusion:", " 85% of Indian farmers own 2–5 cattle. Commercial imported systems (SCR, Nedap) cost ₹35,000–₹50,000/cow — economically unviable.")
    ]
    for h, b in c1_bullets:
        p = t1.add_paragraph()
        p.space_after = Pt(8)
        rh = p.add_run()
        rh.text = "• " + h
        rh.font.bold = True
        rh.font.size = Pt(11.5)
        rh.font.color.rgb = C_NAVY
        rb = p.add_run()
        rb.text = b
        rb.font.size = Pt(11)
        rb.font.color.rgb = C_TEXT

    # Card 2: The LactoGuard Dual-Pillar Solution
    c2 = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(4.75), Inches(1.95), card_w, card_h)
    c2.fill.solid()
    c2.fill.fore_color.rgb = C_CARD_BG
    c2.line.color.rgb = C_EMERALD
    t2 = c2.text_frame
    t2.word_wrap = True
    p2 = t2.paragraphs[0]
    r2 = p2.add_run()
    r2.text = "2. Proposed Solution Architecture\n"
    r2.font.bold = True
    r2.font.size = Pt(15)
    r2.font.color.rgb = C_EMERALD

    c2_bullets = [
        ("Pillar I: Smart Ear Tag:", " Sits on cow's ear; measures continuous rumination jaw chewing (50–70 CPM) & body temp via 50Hz kinematic DSP."),
        ("Pillar II: Bucket Milking Meter:", " Handheld meter clips to bucket wall during milking; scans cow RFID and tests milk Electrical Conductivity (EC) & pH."),
        ("Zero-Pi ESP32 Hub:", " Central gateway receives both node streams via sub-5ms ESP-NOW and uploads to cloud via Wi-Fi or 4G GSM.")
    ]
    for h, b in c2_bullets:
        p = t2.add_paragraph()
        p.space_after = Pt(8)
        rh = p.add_run()
        rh.text = "• " + h
        rh.font.bold = True
        rh.font.size = Pt(11.5)
        rh.font.color.rgb = C_NAVY
        rb = p.add_run()
        rb.text = b
        rb.font.size = Pt(11)
        rb.font.color.rgb = C_TEXT

    # Card 3: Innovation & Uniqueness
    c3 = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.9), Inches(1.95), card_w, card_h)
    c3.fill.solid()
    c3.fill.fore_color.rgb = C_CARD_BG
    c3.line.color.rgb = C_CARD_BD
    t3 = c3.text_frame
    t3.word_wrap = True
    p3 = t3.paragraphs[0]
    r3 = p3.add_run()
    r3.text = "3. Innovation & Uniqueness\n"
    r3.font.bold = True
    r3.font.size = Pt(15)
    r3.font.color.rgb = C_NAVY

    c3_bullets = [
        ("Dual-Domain Diagnostic Fusion:", " Cross-correlates systemic behavioral signs (rumination drop) with physical milk ionic leakage (Na+/Cl- spike)."),
        ("7–14 Day Early Warning:", " Flags prodromal mastitis up to 2 weeks before milk clotting or udder damage occurs."),
        ("Zero Configuration Required:", " Direct peer-to-peer ESP-NOW burst requires zero Wi-Fi pairing or manual entry by rural farmers.")
    ]
    for h, b in c3_bullets:
        p = t3.add_paragraph()
        p.space_after = Pt(8)
        rh = p.add_run()
        rh.text = "• " + h
        rh.font.bold = True
        rh.font.size = Pt(11.5)
        rh.font.color.rgb = C_NAVY
        rb = p.add_run()
        rb.text = b
        rb.font.size = Pt(11)
        rb.font.color.rgb = C_TEXT

    # =========================================================================
    # SLIDE 3: TECHNICAL APPROACH
    # =========================================================================
    slide3 = prs.slides.add_slide(blank_layout)
    add_base_decorations(slide3, 3, "TECHNICAL APPROACH")

    # Left: Technology Stack
    left_s3 = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(1.95), Inches(5.2), Inches(4.9))
    left_s3.fill.solid()
    left_s3.fill.fore_color.rgb = C_CARD_BG
    left_s3.line.color.rgb = C_CARD_BD
    ts3 = left_s3.text_frame
    ts3.word_wrap = True

    ps3_head = ts3.paragraphs[0]
    rs3_head = ps3_head.add_run()
    rs3_head.text = "Core Technology Stack\n"
    rs3_head.font.bold = True
    rs3_head.font.size = Pt(15)
    rs3_head.font.color.rgb = C_NAVY

    stack_items = [
        ("Edge Compute:", " ESP32 Dual-Core Tensilica Xtensa @ 240MHz (Ear Tag, Bucket Meter & Gateway)"),
        ("Sensory Pipeline:", " ADXL345 (3-Axis I2C Accelerometer @ 100Hz), LM35 (Calibrated Analog Temperature), MFRC522 (13.56MHz RFID SPI), Analog EC (K=1.0) & pH Probes"),
        ("Communication:", " ESP-NOW Protocol (2.4GHz connectionless raw action frames, < 5ms latency, channel-hopping 1–11) + 4G GSM Backup"),
        ("Backend & Cloud:", " Netlify Serverless Cloud Functions, MongoDB Atlas NoSQL Database"),
        ("Farmer Frontend:", " React 18, Vite, TailwindCSS (Mobile-first, multilingual, OTP-authenticated)")
    ]
    for k, v in stack_items:
        p = ts3.add_paragraph()
        p.space_after = Pt(7)
        rk = p.add_run()
        rk.text = "▪ " + k
        rk.font.bold = True
        rk.font.size = Pt(11.5)
        rk.font.color.rgb = C_EMERALD
        rv = p.add_run()
        rv.text = v
        rv.font.size = Pt(11)
        rv.font.color.rgb = C_TEXT

    # Right: Architecture Pipeline
    right_s3 = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.1), Inches(1.95), Inches(6.6), Inches(4.9))
    right_s3.fill.solid()
    right_s3.fill.fore_color.rgb = C_CARD_BG
    right_s3.line.color.rgb = C_CARD_BD
    ts3_r = right_s3.text_frame
    ts3_r.word_wrap = True

    ps3_rhead = ts3_r.paragraphs[0]
    rs3_rhead = ps3_rhead.add_run()
    rs3_rhead.text = "Implementation & Data Flow Pipeline\n"
    rs3_rhead.font.bold = True
    rs3_rhead.font.size = Pt(15)
    rs3_rhead.font.color.rgb = C_NAVY

    pipeline_steps = [
        ("Step 1: Continuous Kinematic DSP", "Ear Tag samples ADXL345 at 50Hz. Dual-EMA filter detrends dynamic acceleration from 1g Earth gravity; Schmitt trigger with 500ms refractory lockout tracks cud chewing rate (CPM)."),
        ("Step 2: Milking Bio-Sensing & Tagging", "Farmer taps meter on cow ear tag (MFRC522 RFID read). Meter clips to bucket wall; analog probes oversample milk EC & pH during milking. Pressing SEND computes final statistics."),
        ("Step 3: Low-Latency ESP-NOW Uplink", "Meter and Tag broadcast binary packets directly to Central ESP32 Gateway in < 5ms without router association."),
        ("Step 4: Cloud Ingest & Risk Assessment", "Gateway forwards enriched JSON to Netlify REST API into MongoDB Atlas. AI classifies risk: Normal (EC 4.0–5.5, pH 6.5–6.75) vs Subclinical (EC 5.6–6.4, pH 6.76–6.95) vs Clinical Alert.")
    ]
    for st, sd in pipeline_steps:
        p = ts3_r.add_paragraph()
        p.space_after = Pt(7)
        rst = p.add_run()
        rst.text = st + ": "
        rst.font.bold = True
        rst.font.size = Pt(11.5)
        rst.font.color.rgb = C_NAVY
        rsd = p.add_run()
        rsd.text = sd
        rsd.font.size = Pt(10.5)
        rsd.font.color.rgb = C_TEXT

    # =========================================================================
    # SLIDE 4: FEASIBILITY AND VIABILITY
    # =========================================================================
    slide4 = prs.slides.add_slide(blank_layout)
    add_base_decorations(slide4, 4, "FEASIBILITY AND VIABILITY")

    # Table on Left Side
    rows, cols = 6, 3
    left, top, width, height = Inches(0.6), Inches(1.95), Inches(6.8), Inches(4.8)
    table_shape = slide4.shapes.add_table(rows, cols, left, top, width, height)
    tbl = table_shape.table
    tbl.columns[0].width = Inches(2.2)
    tbl.columns[1].width = Inches(2.4)
    tbl.columns[2].width = Inches(2.2)

    headers = ["System Component", "Commercial (SCR / Afimilk)", "LactoGuard (Our Solution)"]
    for c_idx, text in enumerate(headers):
        cell = tbl.cell(0, c_idx)
        cell.fill.solid()
        cell.fill.fore_color.rgb = C_NAVY
        p = cell.text_frame.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        r = p.add_run()
        r.text = text
        r.font.bold = True
        r.font.size = Pt(10.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    data = [
        ("Gateway Hub", "Industrial PC / Pi (₹6,500)", "ESP32 Edge Hub (~₹400)"),
        ("Animal Sensor", "Proprietary Collar (₹35,000)", "Smart Ear Tag Node (~₹650)"),
        ("Milk Diagnostic", "Robotic Inline Ingest (₹1.5L)", "Clip-on Bucket Meter (~₹850)"),
        ("Total Setup Cost", "₹40,000 – ₹2,00,000+", "Under ₹2,000 Complete!"),
        ("Power / Battery", "Requires daily charging", "6–12 Month Li-ion Life")
    ]
    for r_idx, row_data in enumerate(data):
        for c_idx, text in enumerate(row_data):
            cell = tbl.cell(r_idx + 1, c_idx)
            cell.fill.solid()
            cell.fill.fore_color.rgb = RGBColor(241, 245, 249) if r_idx % 2 == 0 else C_CARD_BG
            p = cell.text_frame.paragraphs[0]
            r = p.add_run()
            r.text = text
            r.font.size = Pt(10)
            if c_idx == 2:
                r.font.bold = True
                r.font.color.rgb = C_EMERALD
            else:
                r.font.color.rgb = C_NAVY if c_idx == 0 else C_TEXT

    # Right Card: Real-World Engineering Mitigations
    right_s4 = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.7), Inches(1.95), Inches(5.0), Inches(4.8))
    right_s4.fill.solid()
    right_s4.fill.fore_color.rgb = C_CARD_BG
    right_s4.line.color.rgb = C_CARD_BD
    ts4_r = right_s4.text_frame
    ts4_r.word_wrap = True

    ps4_rhead = ts4_r.paragraphs[0]
    rs4_rhead = ps4_rhead.add_run()
    rs4_rhead.text = "Engineering Risks & Proven Mitigations\n"
    rs4_rhead.font.bold = True
    rs4_rhead.font.size = Pt(14)
    rs4_rhead.font.color.rgb = C_NAVY

    mitigations = [
        ("False Chews from Head Motion:", " Solved via Dual-EMA orientation-invariant filter. Dynamic gravity vector is subtracted: |a_dyn| = |a_fast - a_slow|. Grazing head tilts cause zero false counts."),
        ("ESP32 ADC Noise on LM35:", " Solved via 64-sample trimmed-mean multi-sampling; discards top/bottom 16 noise spikes to defeat low-end ADC non-linearity."),
        ("Harsh Barn Environment:", " IP67 hermetic 3D enclosure for ear tag; food-grade washable ABS probe casing for milking bucket clipper."),
        ("Rural Power & Internet Outages:", " ESP32 solid-state memory eliminates SD card corruptions; gateway supports seamless 4G GSM backup.")
    ]
    for mk, mv in mitigations:
        p = ts4_r.add_paragraph()
        p.space_after = Pt(7)
        rmk = p.add_run()
        rmk.text = "✓ " + mk
        rmk.font.bold = True
        rmk.font.size = Pt(11)
        rmk.font.color.rgb = C_EMERALD
        rmv = p.add_run()
        rmv.text = mv
        rmv.font.size = Pt(10.5)
        rmv.font.color.rgb = C_TEXT

    # =========================================================================
    # SLIDE 5: IMPACT AND BENEFITS
    # =========================================================================
    slide5 = prs.slides.add_slide(blank_layout)
    add_base_decorations(slide5, 5, "IMPACT AND BENEFITS")

    c5_w = Inches(3.8)
    c5_h = Inches(4.9)

    # Card 1: Economic Impact
    c5_1 = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(1.95), c5_w, c5_h)
    c5_1.fill.solid()
    c5_1.fill.fore_color.rgb = C_CARD_BG
    c5_1.line.color.rgb = C_CARD_BD
    t5_1 = c5_1.text_frame
    t5_1.word_wrap = True
    p5_1 = t5_1.paragraphs[0]
    r5_1 = p5_1.add_run()
    r5_1.text = "1. Economic Impact (Farmer ROI)\n"
    r5_1.font.bold = True
    r5_1.font.size = Pt(15)
    r5_1.font.color.rgb = C_EMERALD

    c5_1_pts = [
        ("₹25,000–₹40,000 Annual Savings:", " For small dairies (3–5 cattle) by averting catastrophic milk yield loss (saving 6–7 kg/day per cow)."),
        ("Zero Milk Dumping Losses:", " Prevents antibiotic contamination and mandatory milk discarding during treatment withdrawal periods."),
        ("75% Veterinary Cost Reduction:", " Early subclinical detection allows low-cost herbal udder washes instead of expensive ₹3,500 antibiotic courses."),
        ("Payback Period: < 45 Days:", " Complete hardware system cost recovered within 1.5 months.")
    ]
    for h, b in c5_1_pts:
        p = t5_1.add_paragraph()
        p.space_after = Pt(7)
        rh = p.add_run()
        rh.text = "• " + h
        rh.font.bold = True
        rh.font.size = Pt(11)
        rh.font.color.rgb = C_NAVY
        rb = p.add_run()
        rb.text = b
        rb.font.size = Pt(10.5)
        rb.font.color.rgb = C_TEXT

    # Card 2: Social Impact
    c5_2 = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(4.75), Inches(1.95), c5_w, c5_h)
    c5_2.fill.solid()
    c5_2.fill.fore_color.rgb = C_CARD_BG
    c5_2.line.color.rgb = C_CARD_BD
    t5_2 = c5_2.text_frame
    t5_2.word_wrap = True
    p5_2 = t5_2.paragraphs[0]
    r5_2 = p5_2.add_run()
    r5_2.text = "2. Social & Rural Upliftment\n"
    r5_2.font.bold = True
    r5_2.font.size = Pt(15)
    r5_2.font.color.rgb = C_NAVY

    c5_2_pts = [
        ("Zero Digital Barrier:", " Mobile OTP login, vernacular language dashboard, and automated RFID scanning require zero technical literacy."),
        ("Empowers Women Dairy Workers:", " 70% of dairy labor in India is performed by rural women; the one-touch bucket clip integrates into existing milking without routine changes."),
        ("Cooperative Model Ready:", " Village Milk Collection Centers (DCS/BMC) can maintain 1 Gateway + 2 Bucket Meters for the entire village, making farmer adoption ultra-affordable.")
    ]
    for h, b in c5_2_pts:
        p = t5_2.add_paragraph()
        p.space_after = Pt(8)
        rh = p.add_run()
        rh.text = "• " + h
        rh.font.bold = True
        rh.font.size = Pt(11)
        rh.font.color.rgb = C_NAVY
        rb = p.add_run()
        rb.text = b
        rb.font.size = Pt(10.5)
        rb.font.color.rgb = C_TEXT

    # Card 3: National & Environmental Impact
    c5_3 = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.9), Inches(1.95), c5_w, c5_h)
    c5_3.fill.solid()
    c5_3.fill.fore_color.rgb = C_CARD_BG
    c5_3.line.color.rgb = C_CARD_BD
    t5_3 = c5_3.text_frame
    t5_3.word_wrap = True
    p5_3 = t5_3.paragraphs[0]
    r5_3 = p5_3.add_run()
    r5_3.text = "3. National Mission Alignment\n"
    r5_3.font.bold = True
    r5_3.font.size = Pt(15)
    r5_3.font.color.rgb = RGBColor(37, 99, 235) # Blue accent

    c5_3_pts = [
        ("Mitigates Antimicrobial Resistance (AMR):", " Preventing clinical mastitis stops massive misuse of 3rd-generation cephalosporins entering India's human milk supply."),
        ("NDLM Pashu Aadhaar Compliance:", " Integrates seamlessly with India's National Digital Livestock Mission 12-digit RFID tagging."),
        ("Direct SDG Contributions:", " Supports SDG 2 (Zero Hunger / Sustainable Dairy), SDG 3 (Public Health / Safe Milk), and SDG 12 (Responsible Consumption).")
    ]
    for h, b in c5_3_pts:
        p = t5_3.add_paragraph()
        p.space_after = Pt(8)
        rh = p.add_run()
        rh.text = "• " + h
        rh.font.bold = True
        rh.font.size = Pt(11)
        rh.font.color.rgb = C_NAVY
        rb = p.add_run()
        rb.text = b
        rb.font.size = Pt(10.5)
        rb.font.color.rgb = C_TEXT

    # =========================================================================
    # SLIDE 6: RESEARCH AND REFERENCES
    # =========================================================================
    slide6 = prs.slides.add_slide(blank_layout)
    add_base_decorations(slide6, 6, "RESEARCH AND REFERENCES")

    # Left: Academic & Clinical References
    left_s6 = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(1.95), Inches(6.0), Inches(4.9))
    left_s6.fill.solid()
    left_s6.fill.fore_color.rgb = C_CARD_BG
    left_s6.line.color.rgb = C_CARD_BD
    ts6 = left_s6.text_frame
    ts6.word_wrap = True

    ps6_head = ts6.paragraphs[0]
    rs6_head = ps6_head.add_run()
    rs6_head.text = "Peer-Reviewed Scientific Literature\n"
    rs6_head.font.bold = True
    rs6_head.font.size = Pt(15)
    rs6_head.font.color.rgb = C_NAVY

    academic_refs = [
        ("ICAR-NDRI & IVRI National Dairy Studies (2022–2024):", " 'Economic Losses Due to Bovine Mastitis in India' — established ₹13,000+ Cr national loss and ₹7,165/cow annual impact."),
        ("Norberg, E. et al. (Journal of Dairy Science, Vol. 87):", " 'Electrical Conductivity of Milk as a Phenotypic Indicator of Mastitis' — proved blood-milk barrier breakdown causes Na+/Cl- surge."),
        ("Borchers, M. R. et al. (Journal of Dairy Science, Vol. 99):", " 'Validation of Rumination and Activity Monitoring for Health Event Detection' — proved rumination drops 18%–25% up to 14 days pre-clinical."),
        ("IDF Bulletin No. 448 (Intl. Dairy Federation):", " 'Physicochemical Markers in Bovine Mastitis: pH Shifts from 6.50 to 7.0+' due to alkaline blood plasma infiltration.")
    ]
    for k, v in academic_refs:
        p = ts6.add_paragraph()
        p.space_after = Pt(7)
        rk = p.add_run()
        rk.text = "▪ " + k
        rk.font.bold = True
        rk.font.size = Pt(11)
        rk.font.color.rgb = C_NAVY
        rv = p.add_run()
        rv.text = v
        rv.font.size = Pt(10.5)
        rv.font.color.rgb = C_TEXT

    # Right: Standards & Verifiable Deployment
    right_s6 = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.9), Inches(1.95), Inches(5.8), Inches(4.9))
    right_s6.fill.solid()
    right_s6.fill.fore_color.rgb = C_CARD_BG
    right_s6.line.color.rgb = C_CARD_BD
    ts6_r = right_s6.text_frame
    ts6_r.word_wrap = True

    ps6_rhead = ts6_r.paragraphs[0]
    rs6_rhead = ps6_rhead.add_run()
    rs6_rhead.text = "Standards & Verifiable Working Prototype\n"
    rs6_rhead.font.bold = True
    rs6_rhead.font.size = Pt(15)
    rs6_rhead.font.color.rgb = C_NAVY

    tech_refs = [
        ("Livestock RFID Standard:", " ISO/IEC 14443 Type A & ISO 11784/11785 (13.56 MHz Animal Identification)"),
        ("Milk Testing Standard:", " Bureau of Indian Standards (BIS: IS 1479 - Chemical Analysis of Milk)"),
        ("Working Hardware Prototype:", " ESP32 Ear Tag + Bucket Meter + Central ESP32 Gateway running tested ESP-NOW firmware with ADXL345 DSP & LM35 filtering."),
        ("Live Deployed Web Platform:", " https://dhenurakshak.netlify.app/"),
        ("Live Cloud Ingest (MongoDB Atlas):", " https://dhenurakshak.netlify.app/api/telemetry"),
        ("Open-Source Code Repository:", " https://github.com/Ankur1212s/DhenuRakshak-AI")
    ]
    for tk, tv in tech_refs:
        p = ts6_r.add_paragraph()
        p.space_after = Pt(7)
        rtk = p.add_run()
        rtk.text = "✓ " + tk + " "
        rtk.font.bold = True
        rtk.font.size = Pt(11)
        rtk.font.color.rgb = C_EMERALD
        rtv = p.add_run()
        rtv.text = tv
        rtv.font.size = Pt(10.5)
        rtv.font.color.rgb = C_TEXT

    # Output file
    output_path = "SIH2026_LactoGuard_Official_Presentation.pptx"
    prs.save(output_path)
    print(f"Presentation created successfully at: {output_path}")

if __name__ == "__main__":
    create_presentation()
