import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def build_exact_sih_pptx():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Exact SIH Official Palette
    C_SIH_BLUE      = RGBColor(29, 112, 184)   # #1D70B8 - Official SIH footer blue
    C_SIH_DARK_BLUE = RGBColor(30, 58, 138)    # #1E3A8A - Top title deep blue
    C_BLACK         = RGBColor(0, 0, 0)        # #000000 - Exact template text
    C_WHITE         = RGBColor(255, 255, 255)
    C_DARK_SLATE    = RGBColor(30, 41, 59)     # #1E293B - Crisp body text
    C_EMERALD       = RGBColor(5, 150, 105)    # #059669 - Technical highlight
    C_SUB_BLUE      = RGBColor(27, 75, 138)    # #1B4B8A - Pointer bold blue
    C_BG            = RGBColor(255, 255, 255)  # Pure White background

    def apply_sih_slide_master(slide, page_num, center_title_text):
        # 1. Background: Pure White
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = C_WHITE
        bg.line.fill.background()

        # 2. Top-Left Oval: "Your Team Name" (Matches SIH Template Exactly)
        oval = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(0.5), Inches(0.35), Inches(1.55), Inches(1.05))
        oval.fill.solid()
        oval.fill.fore_color.rgb = C_WHITE
        oval.line.color.rgb = C_BLACK
        oval.line.width = Pt(1.2)
        tf_ov = oval.text_frame
        tf_ov.word_wrap = True
        tf_ov.vertical_anchor = MSO_ANCHOR.MIDDLE
        p_ov = tf_ov.paragraphs[0]
        p_ov.alignment = PP_ALIGN.CENTER
        r_ov = p_ov.add_run()
        r_ov.text = "Your\nTeam\nName"
        r_ov.font.name = "Arial"
        r_ov.font.size = Pt(11)
        r_ov.font.color.rgb = C_BLACK

        # 3. Top-Center Title (Exact Serif Uppercase from Template)
        tbox = slide.shapes.add_textbox(Inches(2.5), Inches(0.4), Inches(8.333), Inches(0.9))
        tf_t = tbox.text_frame
        tf_t.word_wrap = True
        p_t = tf_t.paragraphs[0]
        p_t.alignment = PP_ALIGN.CENTER
        r_t = p_t.add_run()
        r_t.text = center_title_text
        r_t.font.name = "Times New Roman"
        r_t.font.size = Pt(26)
        r_t.font.bold = True
        r_t.font.color.rgb = C_BLACK

        # 4. Top-Right SIH 2026 Branding Block (Matches Template Exactly)
        rbox = slide.shapes.add_textbox(Inches(11.0), Inches(0.35), Inches(2.0), Inches(1.0))
        tf_r = rbox.text_frame
        p_r = tf_r.paragraphs[0]
        p_r.alignment = PP_ALIGN.RIGHT
        r_r = p_r.add_run()
        r_r.text = "SMART INDIA\nHACKATHON\n2026"
        r_r.font.name = "Arial"
        r_r.font.size = Pt(11)
        r_r.font.bold = True
        r_r.font.color.rgb = C_SIH_DARK_BLUE

        # 5. Bottom Solid Blue Footer Bar (Matches Template Exactly)
        footer = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, Inches(7.05), Inches(13.333), Inches(0.45))
        footer.fill.solid()
        footer.fill.fore_color.rgb = C_SIH_BLUE
        footer.line.fill.background()

        tf_f = footer.text_frame
        tf_f.vertical_anchor = MSO_ANCHOR.MIDDLE
        p_f = tf_f.paragraphs[0]
        p_f.alignment = PP_ALIGN.CENTER
        r_f = p_f.add_run()
        r_f.text = f"@SIH Idea submission- Template    {page_num}"
        r_f.font.name = "Arial"
        r_f.font.size = Pt(9.5)
        r_f.font.color.rgb = C_WHITE

    # =========================================================================
    # SLIDE 1: TITLE PAGE (Exact Match to SIH 2026 Page 1)
    # =========================================================================
    slide1 = prs.slides.add_slide(blank_layout)
    bg1 = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = C_WHITE
    bg1.line.fill.background()

    # Top SIH Header
    t_box = slide1.shapes.add_textbox(Inches(1.0), Inches(0.45), Inches(9.8), Inches(0.7))
    p_th = t_box.text_frame.paragraphs[0]
    r_th = p_th.add_run()
    r_th.text = "SMART INDIA HACKATHON 2026"
    r_th.font.name = "Times New Roman"
    r_th.font.size = Pt(32)
    r_th.font.bold = True
    r_th.font.color.rgb = C_SIH_DARK_BLUE

    # Top-Right SIH Logo Text
    rbox1 = slide1.shapes.add_textbox(Inches(11.0), Inches(0.35), Inches(2.0), Inches(1.0))
    tf_r1 = rbox1.text_frame
    p_r1 = tf_r1.paragraphs[0]
    p_r1.alignment = PP_ALIGN.RIGHT
    r_r1 = p_r1.add_run()
    r_r1.text = "SMART INDIA\nHACKATHON\n2026"
    r_r1.font.name = "Arial"
    r_r1.font.size = Pt(11)
    r_r1.font.bold = True
    r_r1.font.color.rgb = C_SIH_DARK_BLUE

    # Center: TITLE PAGE
    tp_box = slide1.shapes.add_textbox(Inches(1.0), Inches(1.2), Inches(11.333), Inches(0.55))
    p_tp = tp_box.text_frame.paragraphs[0]
    p_tp.alignment = PP_ALIGN.CENTER
    r_tp = p_tp.add_run()
    r_tp.text = "TITLE PAGE"
    r_tp.font.name = "Times New Roman"
    r_tp.font.size = Pt(24)
    r_tp.font.bold = True
    r_tp.font.color.rgb = C_BLACK

    # Left Column: Exact Pointers from Template
    left_meta = slide1.shapes.add_textbox(Inches(0.8), Inches(1.9), Inches(7.6), Inches(5.3))
    tf_lm = left_meta.text_frame
    tf_lm.word_wrap = True

    title_entries = [
        ("Problem Statement ID –", " [Enter your SIH PS ID, e.g. SIH109 / 1642]"),
        ("Problem Statement Title-", " Early Detection and Prevention of Bovine Mastitis in Dairy Cattle"),
        ("Theme-", " Agriculture, FoodTech & Rural Development / IoT / MedTech"),
        ("PS Category-", " Hardware (IoT, Wireless DSP & Multi-Sensor Cloud Platform)"),
        ("Team ID-", " [Enter your Team ID from SIH Portal]"),
        ("Team Name (Registered on portal)", " [Enter your Registered Team Name]"),
        ("Project Name-", " LactoGuard (DhenuRakshak AI) — Zero-Pi IoT & Edge AI Herd Health Ecosystem")
    ]
    for i, (label, val) in enumerate(title_entries):
        p = tf_lm.paragraphs[0] if i == 0 else tf_lm.add_paragraph()
        p.space_after = Pt(12)
        rl = p.add_run()
        rl.text = f"• {label}"
        rl.font.name = "Arial"
        rl.font.size = Pt(14)
        rl.font.bold = True
        rl.font.color.rgb = C_BLACK
        rv = p.add_run()
        rv.text = val
        rv.font.name = "Arial"
        rv.font.size = Pt(13)
        rv.font.color.rgb = C_DARK_SLATE

    # Right Column: Visual Clean System Box
    right_box = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.7), Inches(2.1), Inches(4.0), Inches(4.8))
    right_box.fill.solid()
    right_box.fill.fore_color.rgb = RGBColor(248, 250, 252)
    right_box.line.color.rgb = C_SIH_BLUE
    right_box.line.width = Pt(1.5)
    tf_rb = right_box.text_frame
    tf_rb.word_wrap = True

    p_rb_head = tf_rb.paragraphs[0]
    p_rb_head.alignment = PP_ALIGN.CENTER
    r_rb_head = p_rb_head.add_run()
    r_rb_head.text = "PROTOTYPE OVERVIEW\n\n"
    r_rb_head.font.name = "Arial"
    r_rb_head.font.size = Pt(14)
    r_rb_head.font.bold = True
    r_rb_head.font.color.rgb = C_SIH_DARK_BLUE

    box_items = [
        "🐄 Smart Ear Tag Node\n   ADXL345 50Hz DSP + LM35 Temp",
        "🥛 Handheld Milking Bucket Meter\n   MFRC522 RFID + Milk EC + Milk pH",
        "⚡ Zero-Pi Central ESP32 Gateway\n   ESP-NOW Multi-Node Ingest (<5ms)",
        "☁️ Cloud Web Dashboard & DB\n   MongoDB Atlas + Netlify Serverless",
        "💰 Total System Cost: < ₹2,000\n   Disrupting ₹45,000+ foreign collars"
    ]
    for item in box_items:
        p = tf_rb.add_paragraph()
        p.space_after = Pt(8)
        r = p.add_run()
        r.text = "▪ " + item
        r.font.name = "Arial"
        r.font.size = Pt(11)
        r.font.color.rgb = C_DARK_SLATE

    # =========================================================================
    # SLIDE 2: PROPOSED SOLUTION (Exact Match to SIH 2026 Page 2)
    # =========================================================================
    slide2 = prs.slides.add_slide(blank_layout)
    # In official template, center title is "IDEA TITLE" or specific Idea Title
    apply_sih_slide_master(slide2, 2, "IDEA TITLE: LACTOGUARD")

    # Blue Subheading (Exact from template)
    sub2 = slide2.shapes.add_textbox(Inches(0.6), Inches(1.4), Inches(12.133), Inches(0.45))
    p_sub2 = sub2.text_frame.paragraphs[0]
    r_sub2 = p_sub2.add_run()
    r_sub2.text = "❖Proposed Solution (Describe your Idea/Solution/Prototype)"
    r_sub2.font.name = "Arial"
    r_sub2.font.size = Pt(18)
    r_sub2.font.bold = True
    r_sub2.font.color.rgb = C_SIH_DARK_BLUE

    # 3 Main Official Pointers in Body
    body2 = slide2.shapes.add_textbox(Inches(0.6), Inches(1.95), Inches(12.133), Inches(5.0))
    tf2 = body2.text_frame
    tf2.word_wrap = True

    # Pointer 1
    p2_1 = tf2.paragraphs[0]
    p2_1.space_before = Pt(4)
    r2_1 = p2_1.add_run()
    r2_1.text = "• Detailed explanation of the proposed solution"
    r2_1.font.name = "Arial"
    r2_1.font.size = Pt(14)
    r2_1.font.bold = True
    r2_1.font.color.rgb = C_BLACK

    p2_1_sub1 = tf2.add_paragraph()
    p2_1_sub1.space_after = Pt(4)
    r = p2_1_sub1.add_run()
    r.text = "   - Pillar 1 (Continuous Behavioral Monitoring): Smart Cattle Ear Tag with 3-axis ADXL345 accelerometer running 50Hz kinematic DSP to track rumination jaw chewing dynamics (50–70 CPM) and precision LM35 core body temperature."
    r.font.size = Pt(11.5)
    r.font.color.rgb = C_DARK_SLATE

    p2_1_sub2 = tf2.add_paragraph()
    p2_1_sub2.space_after = Pt(4)
    r = p2_1_sub2.add_run()
    r.text = "   - Pillar 2 (Direct Milk Bio-Sensing): Low-cost Handheld Bucket Meter equipped with MFRC522 RFID reader, analog Electrical Conductivity (EC) probe, and analog pH sensor. Farmer taps meter on cow's RFID ear tag, clips it to the milking bucket wall, and presses START to sample milk during milking."
    r.font.size = Pt(11.5)
    r.font.color.rgb = C_DARK_SLATE

    p2_1_sub3 = tf2.add_paragraph()
    p2_1_sub3.space_after = Pt(8)
    r = p2_1_sub3.add_run()
    r.text = "   - Central ESP32 Gateway: Eliminates Raspberry Pi; receives telemetry from both nodes via sub-5ms ESP-NOW wireless broadcast and pushes enriched JSON directly to MongoDB Atlas Cloud via Wi-Fi or 4G GSM."
    r.font.size = Pt(11.5)
    r.font.color.rgb = C_DARK_SLATE

    # Pointer 2
    p2_2 = tf2.add_paragraph()
    r2_2 = p2_2.add_run()
    r2_2.text = "• How it addresses the problem"
    r2_2.font.name = "Arial"
    r2_2.font.size = Pt(14)
    r2_2.font.bold = True
    r2_2.font.color.rgb = C_BLACK

    p2_2_sub1 = tf2.add_paragraph()
    p2_2_sub1.space_after = Pt(4)
    r = p2_2_sub1.add_run()
    r.text = "   - Detects Subclinical Mastitis 7 to 14 days before visible swelling, milk clotting, or irreversible mammary tissue damage occurs."
    r.font.size = Pt(11.5)
    r.font.color.rgb = C_DARK_SLATE

    p2_2_sub2 = tf2.add_paragraph()
    p2_2_sub2.space_after = Pt(8)
    r = p2_2_sub2.add_run()
    r.text = "   - Solves the Economic Barrier for 85% of Indian dairy smallholders (owning 2–5 cows) by delivering an end-to-end multi-device system under ₹2,000, replacing foreign collars costing ₹35,000–₹50,000 per cow."
    r.font.size = Pt(11.5)
    r.font.color.rgb = C_DARK_SLATE

    # Pointer 3
    p2_3 = tf2.add_paragraph()
    r2_3 = p2_3.add_run()
    r2_3.text = "• Innovation and uniqueness of the solution"
    r2_3.font.name = "Arial"
    r2_3.font.size = Pt(14)
    r2_3.font.bold = True
    r2_3.font.color.rgb = C_BLACK

    p2_3_sub1 = tf2.add_paragraph()
    p2_3_sub1.space_after = Pt(4)
    r = p2_3_sub1.add_run()
    r.text = "   - Multi-Modal Diagnostic Fusion: Cross-validates systemic behavioral changes (rumination drop) with physical milk ionic leakage (Na+/Cl- surge causing EC > 5.8 mS/cm and pH > 6.8), eliminating false positives."
    r.font.size = Pt(11.5)
    r.font.color.rgb = C_DARK_SLATE

    p2_3_sub2 = tf2.add_paragraph()
    r = p2_3_sub2.add_run()
    r.text = "   - Zero-Config ESP-NOW Peer-to-Peer Protocol: Transmits in < 5ms without needing router pairing, passwords, or smartphone intervention by rural farmers."
    r.font.size = Pt(11.5)
    r.font.color.rgb = C_DARK_SLATE

    # =========================================================================
    # SLIDE 3: TECHNICAL APPROACH (Exact Match to SIH 2026 Page 3)
    # =========================================================================
    slide3 = prs.slides.add_slide(blank_layout)
    apply_sih_slide_master(slide3, 3, "TECHNICAL APPROACH")

    body3 = slide3.shapes.add_textbox(Inches(0.6), Inches(1.5), Inches(12.133), Inches(5.4))
    tf3 = body3.text_frame
    tf3.word_wrap = True

    # Pointer 1
    p3_1 = tf3.paragraphs[0]
    r3_1 = p3_1.add_run()
    r3_1.text = "• Technologies to be used (e.g. programming languages, frameworks, hardware)"
    r3_1.font.name = "Arial"
    r3_1.font.size = Pt(14)
    r3_1.font.bold = True
    r3_1.font.color.rgb = C_BLACK

    tech_bullets = [
        "Hardware & MCUs: ESP32 DevKit V1 (Dual-Core 240MHz) on Ear Tag, Bucket Meter & Central Gateway.",
        "Sensors & Signal Conditioning: ADXL345 (3-Axis I2C Accelerometer), LM35 Precision Analog Temp Sensor (ADC1), MFRC522 (13.56 MHz SPI RFID), Analog EC (K=1.0) & pH Probes.",
        "Wireless & Network Stack: ESP-NOW (2.4GHz connectionless raw action frames, < 5ms latency, channel-hopping 1–11) + 4G GSM (SIMCOM A7670C UART AT Commands).",
        "Cloud & Data Pipeline: Netlify Serverless Cloud Functions, MongoDB Atlas NoSQL Database (Cluster0).",
        "Frontend & Visualization: React 18, Vite, TailwindCSS — Mobile-first, OTP authenticated, multilingual."
    ]
    for tb in tech_bullets:
        p = tf3.add_paragraph()
        p.space_after = Pt(3)
        r = p.add_run()
        r.text = "   - " + tb
        r.font.size = Pt(11)
        r.font.color.rgb = C_DARK_SLATE

    # Pointer 2
    p3_2 = tf3.add_paragraph()
    p3_2.space_before = Pt(8)
    r3_2 = p3_2.add_run()
    r3_2.text = "• Methodology and process for implementation (Flow Charts/Images/ working prototype)"
    r3_2.font.name = "Arial"
    r3_2.font.size = Pt(14)
    r3_2.font.bold = True
    r3_2.font.color.rgb = C_BLACK

    method_steps = [
        "1. Kinematic DSP Pipeline: Ear Tag samples ADXL345 at 50Hz. Dual-EMA filter detrends dynamic movement from 1g Earth gravity. Schmitt trigger with 500ms refractory lockout detects jaw cud chewing and computes CPM.",
        "2. Milking Ingest & Tagging: Farmer taps Bucket Meter to ear tag (MFRC522 RFID read). Meter clips to bucket wall; analog probes oversample milk EC & pH during milking. Pressing SEND computes session averages.",
        "3. Zero-Pi Edge Relay: Bucket Meter and Ear Tag broadcast binary packets over ESP-NOW directly to Central ESP32 Gateway in < 5ms without router association.",
        "4. Cloud Diagnostics & Alerting: Gateway forwards payload to Netlify serverless endpoint into MongoDB Atlas. Web dashboard (https://dhenurakshak.netlify.app/) displays real-time health stream and 7–14 day mastitis forecast."
    ]
    for ms in method_steps:
        p = tf3.add_paragraph()
        p.space_after = Pt(3)
        r = p.add_run()
        r.text = "   - " + ms
        r.font.size = Pt(11)
        r.font.color.rgb = C_DARK_SLATE

    # =========================================================================
    # SLIDE 4: FEASIBILITY AND VIABILITY (Exact Match to SIH 2026 Page 4)
    # =========================================================================
    slide4 = prs.slides.add_slide(blank_layout)
    apply_sih_slide_master(slide4, 4, "FEASIBILITY AND VIABILITY")

    body4 = slide4.shapes.add_textbox(Inches(0.6), Inches(1.5), Inches(12.133), Inches(5.4))
    tf4 = body4.text_frame
    tf4.word_wrap = True

    # Pointer 1
    p4_1 = tf4.paragraphs[0]
    r4_1 = p4_1.add_run()
    r4_1.text = "• Analysis of the feasibility of the idea"
    r4_1.font.name = "Arial"
    r4_1.font.size = Pt(14)
    r4_1.font.bold = True
    r4_1.font.color.rgb = C_BLACK

    feas_points = [
        "Economic Feasibility: Built 100% using commercially off-the-shelf, low-cost Indian electronics. Total hardware BOM is < ₹2,000 (Ear Tag: ~₹650 | Bucket Meter: ~₹850 | ESP32 Gateway: ~₹400) vs. ₹40,000–₹2,00,000 commercial herd collars (SCR / Afimilk).",
        "Power Feasibility: Wi-Fi radio is kept powered OFF during milking; ESP-NOW transmits in 5ms burst mode, enabling 6–12 months battery life on a standard 3.7V 18650 Li-ion cell.",
        "Biophysical Feasibility: Grounded in milk electro-chemistry. Mastitis causes inflammatory breakdown of tight junctions, leaking blood plasma Na+ and Cl- ions into milk (EC rises from 4.5 to > 6.0 mS/cm; pH shifts from 6.6 to > 6.9)."
    ]
    for fp in feas_points:
        p = tf4.add_paragraph()
        p.space_after = Pt(3)
        r = p.add_run()
        r.text = "   - " + fp
        r.font.size = Pt(11)
        r.font.color.rgb = C_DARK_SLATE

    # Pointer 2
    p4_2 = tf4.add_paragraph()
    p4_2.space_before = Pt(8)
    r4_2 = p4_2.add_run()
    r4_2.text = "• Potential challenges and risks"
    r4_2.font.name = "Arial"
    r4_2.font.size = Pt(14)
    r4_2.font.bold = True
    r4_2.font.color.rgb = C_BLACK

    risks = [
        "False Chewing Triggers: Animal ear flapping, head shaking, and grazing head tilts creating phantom chewing counts.",
        "ESP32 ADC Non-Linearity & Noise: ESP32 ADC thermal noise and non-linearity below 0.1V skewing LM35 analog temperature readings.",
        "Harsh Barn Environment & Power Outages: Moisture, cow dung, and frequent rural electrical blackouts corrupting gateway filesystems."
    ]
    for rk in risks:
        p = tf4.add_paragraph()
        p.space_after = Pt(3)
        r = p.add_run()
        r.text = "   - " + rk
        r.font.size = Pt(11)
        r.font.color.rgb = C_DARK_SLATE

    # Pointer 3
    p4_3 = tf4.add_paragraph()
    p4_3.space_before = Pt(8)
    r4_3 = p4_3.add_run()
    r4_3.text = "• Strategies for overcoming these challenges"
    r4_3.font.name = "Arial"
    r4_3.font.size = Pt(14)
    r4_3.font.bold = True
    r4_3.font.color.rgb = C_BLACK

    strats = [
        "Dual-EMA Orientation-Invariant DSP: Dynamic gravity vector is subtracted (|a_dyn| = |a_fast - a_slow|). Schmitt trigger with 500ms refractory lockout eliminates head-shake spikes.",
        "64-Sample Trimmed-Mean ADC Filter: Discards top and bottom 16 transient noise spikes, averaging middle 32 samples for clinical-grade LM35 temperature readings.",
        "Solid-State Zero-Pi Gateway: Eliminates Raspberry Pi SD card corruption; IP67 hermetic 3D enclosures for ear tag and washable ABS probe housing."
    ]
    for st in strats:
        p = tf4.add_paragraph()
        p.space_after = Pt(3)
        r = p.add_run()
        r.text = "   - " + st
        r.font.size = Pt(11)
        r.font.color.rgb = C_DARK_SLATE

    # =========================================================================
    # SLIDE 5: IMPACT AND BENEFITS (Exact Match to SIH 2026 Page 5)
    # =========================================================================
    slide5 = prs.slides.add_slide(blank_layout)
    apply_sih_slide_master(slide5, 5, "IMPACT AND BENEFITS")

    body5 = slide5.shapes.add_textbox(Inches(0.6), Inches(1.5), Inches(12.133), Inches(5.4))
    tf5 = body5.text_frame
    tf5.word_wrap = True

    # Pointer 1
    p5_1 = tf5.paragraphs[0]
    r5_1 = p5_1.add_run()
    r5_1.text = "• Potential impact on the target audience"
    r5_1.font.name = "Arial"
    r5_1.font.size = Pt(14)
    r5_1.font.bold = True
    r5_1.font.color.rgb = C_BLACK

    aud_impacts = [
        "Direct Farmer Economic Protection: Saves ₹25,000 to ₹40,000 annually per small dairy farm (3–5 cows) by preventing catastrophic milk yield drops (averting loss of 6–7 kg milk/day per cow).",
        "Complete Elimination of Discarded Milk: Early detection avoids the mandatory milk dumping required during antibiotic withdrawal periods (saving ~₹1,800/week during illness).",
        "Frictionless Rural Adoption: Mobile OTP login, vernacular language dashboard, and automated RFID scanning require zero technical literacy from rural dairy farmers.",
        "Empowering Women Dairy Workers: 70% of milking labor in India is performed by women; the one-touch bucket clipper requires no change to daily milking routines."
    ]
    for ai in aud_impacts:
        p = tf5.add_paragraph()
        p.space_after = Pt(4)
        r = p.add_run()
        r.text = "   - " + ai
        r.font.size = Pt(11.5)
        r.font.color.rgb = C_DARK_SLATE

    # Pointer 2
    p5_2 = tf5.add_paragraph()
    p5_2.space_before = Pt(10)
    r5_2 = p5_2.add_run()
    r5_2.text = "• Benefits of the solution (social, economic, environmental, etc.)"
    r5_2.font.name = "Arial"
    r5_2.font.size = Pt(14)
    r5_2.font.bold = True
    r5_2.font.color.rgb = C_BLACK

    benefits = [
        "Economic: 75% reduction in veterinary antibiotic costs via low-cost subclinical antiseptic/herbal washes. Complete hardware payback period is under 45 days.",
        "Environmental & Public Health (AMR): Eliminates indiscriminate use of 3rd-generation cephalosporins and penicillins, preventing antibiotic drug residues from contaminating India's commercial milk supply.",
        "National Policy Alignment: Aligns directly with the National Digital Livestock Mission (NDLM / Pashu Aadhaar), Rashtriya Gokul Mission, and UN Sustainable Development Goals: SDG 2 (Zero Hunger), SDG 3 (Good Health & Well-being), and SDG 12 (Responsible Consumption)."
    ]
    for bn in benefits:
        p = tf5.add_paragraph()
        p.space_after = Pt(4)
        r = p.add_run()
        r.text = "   - " + bn
        r.font.size = Pt(11.5)
        r.font.color.rgb = C_DARK_SLATE

    # =========================================================================
    # SLIDE 6: RESEARCH AND REFERENCES (Exact Match to SIH 2026 Page 6)
    # =========================================================================
    slide6 = prs.slides.add_slide(blank_layout)
    apply_sih_slide_master(slide6, 6, "RESEARCH AND REFERENCES")

    body6 = slide6.shapes.add_textbox(Inches(0.6), Inches(1.5), Inches(12.133), Inches(5.4))
    tf6 = body6.text_frame
    tf6.word_wrap = True

    # Pointer 1 (Exact from template)
    p6_1 = tf6.paragraphs[0]
    r6_1 = p6_1.add_run()
    r6_1.text = "• Details / Links of the reference and research work"
    r6_1.font.name = "Arial"
    r6_1.font.size = Pt(14)
    r6_1.font.bold = True
    r6_1.font.color.rgb = C_BLACK

    refs = [
        "1. ICAR-NDRI & IVRI National Dairy Studies (2022–2024): 'Economic Losses Due to Bovine Mastitis in India' — established ₹13,000+ Crore national industry loss and ₹7,165/cow annual impact.",
        "2. Norberg, E. et al. (Journal of Dairy Science, Vol. 87): 'Electrical Conductivity of Milk as a Phenotypic Indicator of Mastitis' — proved blood-milk barrier breakdown causes Na+ and Cl- electrolyte leakage.",
        "3. Borchers, M. R. et al. (Journal of Dairy Science, Vol. 99): 'Validation of Rumination and Activity Monitoring Systems for Health Event Detection' — proved rumination drops 18%–25% up to 14 days pre-clinical.",
        "4. International Dairy Federation (IDF Bulletin No. 448): 'Physicochemical Markers in Bovine Mastitis: pH Shifts from 6.50 to 7.0+' due to alkaline blood plasma infiltration.",
        "5. ISO/IEC Standards: ISO/IEC 14443 Type A & ISO 11784/11785 (13.56 MHz RFID Animal Identification Standards) and BIS IS:1479 (Chemical Analysis of Milk).",
        "6. Live Deployed Web Dashboard: https://dhenurakshak.netlify.app/ (Live real-time farmer interface).",
        "7. Cloud Telemetry Ingest Endpoint: https://dhenurakshak.netlify.app/api/telemetry (Connected to MongoDB Atlas cluster).",
        "8. Open-Source Hardware & Firmware Repository: https://github.com/Ankur1212s/DhenuRakshak-AI (Contains all verified ESP32 code)."
    ]
    for rf in refs:
        p = tf6.add_paragraph()
        p.space_after = Pt(4)
        r = p.add_run()
        r.text = "   - " + rf
        r.font.size = Pt(11)
        r.font.color.rgb = C_DARK_SLATE

    # Save presentation
    output_path = "SIH2026_Official_Template_Exact.pptx"
    prs.save(output_path)
    print(f"Exact SIH presentation created at: {output_path}")

if __name__ == "__main__":
    build_exact_sih_pptx()
