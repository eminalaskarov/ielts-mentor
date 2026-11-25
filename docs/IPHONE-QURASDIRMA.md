# IELTS Mentor — iPhone-da quraşdırma və istifadə təlimatı

## Tətbiq nədir?

IELTS Mentor sizin şəxsi IELTS hazırlıq köməkçinizdir. B1 səviyyəsindən IELTS Academic 7.0+ hədəfinə qədər 12 ay (2026-cı il noyabr – 2027-ci il noyabr) hər gün nə etməli olduğunuzu göstərir:

- bugünkü tapşırıqlar və taymerlər;
- gündəlik qısa test;
- söz kartları (təkrar sistemi ilə);
- səhvlər dəftəri;
- yazı və danışıq məşqləri (səs yazısı ilə);
- nəticə jurnalı və irəliləyiş.

Əsas məqamlar:

- Tətbiq iPhone-da veb səhifə kimi işləyir. App Store-dan yüklənmir.
- Məlumatlarınız yalnız bu telefonda saxlanılır. Hesab, server və reklam yoxdur.
- Tətbiqin ekranları ingilis dilindədir. Bu təlimatda düymələrin adları tətbiqdəki kimi, ingiliscə yazılıb.

## Onlayn yerləşdirmə

Tətbiqin işləməsi üçün onu HTTPS ünvanında yerləşdirmək lazımdır (pulsuz GitHub Pages və ya Netlify). Bu addım yalnız siz təsdiq verdikdən sonra Claude ilə birlikdə görüləcək. Hələlik heç bir əmr icra etməyin.

Link hazır olduqdan sonra:

1. Linki **Safari** ilə açın. Chrome-da açmayın.
2. Səhifənin aşağısında **Paylaş** (kvadratdan çıxan ox) düyməsinə basın.
3. Siyahıda aşağı sürüşdürüb **Add to Home Screen** seçin.
4. Ana ekranda **IELTS Mentor** ikonası yaranacaq.
5. **Bundan sonra tətbiqi yalnız həmin ikonadan açın, Safari-dən yox.** Ana ekran tətbiqinin məlumatları Safari-dən ayrı saxlanılır. Safari-də açsanız, ayrı boş məlumat görəcəksiniz.
6. İlk dəfə açanda qarşılama ekranları çıxacaq:
   1. **Get started** basın.
   2. Başlanğıc tarixi (**Start date**) və imtahan tarixini (**Exam date**) seçin, **Continue** basın. İmtahan tarixini bilmirsinizsə, **I don’t know yet** basın.
   3. Hədəf balı seçin (**Overall band**) və istəyə bağlı universitet minimumunu daxil edin, sonra **Continue** basın.
   4. **Go to Today** basın.
7. Danışıq (Speaking) bölməsində səs yazmaq üçün **Allow microphone and record** basın (Part 2-də isə əvvəlcə **Start preparing (1 min)**). Sonra iPhone-un çıxan pəncərəsində icazə verin (**Allow** və ya **İcazə ver**).

## İnternetsiz işləmək

- İlk açılışdan sonra tətbiq internet olmadan da işləyir: tapşırıqlar, testlər, söz kartları, yazı və danışıq məşqləri.
- Səhifənin yuxarısında **You’re offline. Everything still works.** yazısı çıxa bilər. Bu normaldır.
- Yeni versiya çıxanda ekranın yuxarısında **A new version is ready.** banneri görünəcək. Yeniləmək üçün **Update** basın (bu zaman internet lazımdır). Hələ yeniləmək istəmirsinizsə, sağdakı ✕ işarəsinə basın.

## Ehtiyat nüsxə (ən vacib hissə)

**Diqqət:** bütün məlumatlarınız yalnız bu telefondadır. Telefonu itirsəniz, xarab olsa, tətbiqi silsəniz və ya Safari-də veb sayt məlumatlarını təmizləsəniz, hər şey itəcək. Buna görə hər həftə ehtiyat nüsxə çıxarın.

### Ehtiyat nüsxənin çıxarılması

1. **Today** ekranında sağ yuxarıdakı ⚙ (Settings) düyməsinə basın və ya **Progress** sekmesindən **Backup & Restore** açın.
2. **Back up now** basın.
3. Faylın hazır olması yazısı çıxanda **Share backup file** basın.
4. Açılan pəncərədə **Save to Files** seçin, **iCloud Drive** qovluğunu seçin və saxlayın.

Fayl `ielts-mentor-backup-` ilə başlayan və `.json` ilə bitən ad alır.

Tətbiq ehtiyat nüsxə çıxarmağı həftəlik xatırladır (**Backup reminders** bölməsində **Weekly**, **Every 2 weeks**, **Monthly** və ya **Never** seçə bilərsiniz). Xatırlatma yalnız tətbiq açılanda Today ekranında kart şəklində görünür.

### Bərpa (restore)

1. **Backup & Restore** ekranında **Choose backup file** basın və Files-da əvvəlki faylı seçin.
2. Ekranda faylın tarixi, söz, esse və gün sayı göstəriləcək. Yoxlayın.
3. **Replace everything** basın və təsdiq pəncərəsində OK deyin.

Bərpa cari məlumatların üstünə yazır. Əvvəl hazırkı vəziyyəti saxlamaq üçün **Back up current data first** basın.

### Təhlükəsizlik nüsxəsi (safety copy) və geri qaytarma

- Bərpa və ya import edəndə tətbiq cari məlumatlarınızın təhlükəsizlik nüsxəsini avtomatik yaradır. Bu nüsxə 7 gün saxlanılır.
- Səhv bərpa etdiyinizi görsəniz, **Backup & Restore** ekranında görünən **Undo import** (və ya **Undo restore**) düyməsinə basın. Məlumatlar əvvəlki vəziyyətinə qayıdacaq.
- Tətbiq açılmırsa və xəta ekranı çıxırsa, orada **Restore safety copy** düyməsi də ola bilər. Bunu yalnız ən son çarə kimi, əvvəlcə **Export raw data** ilə faylı saxladıqdan sonra istifadə edin.

### Məlumatların silinməsi

- Tətbiqi ana ekrandan silsəniz, məlumatlar da silinir.
- Safari-də veb sayt məlumatlarını təmizləsəniz, məlumatlar silinir.
- Tətbiqin içində **Settings** › **Danger zone** bölməsində **Erase all data** var. Bu düymə bütün məlumatı silir. Təsdiq üçün **ERASE** yazmaq lazımdır.

## Səs yazıları

- Danışıq bölməsində etdiyiniz səs yazıları **24 saat sonra avtomatik silinir**.
- Yazını saxlamaq istəyirsinizsə, həmin müddət bitməmişdən əvvəl **Save to Files / share** basın və faylı Files-a və ya iCloud Drive-a göndərin.
- Öz-özünə yoxlama nəticələri (checklist) isə həmişəlik qalır.
- **Backup & Restore** ekranında **Include voice recordings** seçimi var. Defolt olaraq söndürülüb. Yazılar yalnız hələ 24 saatı bitməmiş olduqda ehtiyat nüsxəyə daxil olur.

## Məhdudiyyətlər

- **Bildiriş (notification) yoxdur.** Tətbiq sizi xaricdən xatırlatmır. Tətbiqi açanda Today ekranında xatırlatma kartları görünür. İstəsəniz, iPhone-un Clock və ya Calendar tətbiqində öz xatırlatmanızı qurun.
- **Task 1 qrafikləri** şəkil kimi deyil, mətn və cədvəl şəklində verilir.
- **Tətbiq kitablara istinad edir**, kitabların mətnini özündə saxlamır. Tövsiyə olunan kitablar:
  - Raymond Murphy, *English Grammar in Use* (5-ci nəşr)
  - Martin Hewings, *Advanced Grammar in Use*
  - *English Vocabulary in Use* (Upper-Intermediate) və ya *Oxford Word Skills* (Intermediate)
  - *Cambridge IELTS 14–19 (Academic)*
- Kitabları qanuni yolla əldə edin: mağazadan alaraq, e-kitab kimi, kitabxanadan və ya pulsuz rəsmi məşq testlərindən. Rəsmi testlər British Council, IDP və ielts.org saytlarında var.
- Tətbiq tarixləri Bakı vaxtı (Asia/Baku) ilə hesablayır.

## Problemlər və həlli

**Ekran boşdur və ya xəta yazısı çıxır**
1. Əvvəlcə **Export raw data** basın və faylı **Files** və ya **iCloud Drive**-a saxlayın.
2. Sonra **Reload the app** basın.
3. Ekran tamamilə boşdursa, telefonu yenidən başladın və tətbiqi yalnız ana ekran ikonasından açın.
4. Hələ də açılmırsa, saxladığınız faylı qoruyun və Claude-a yazın.

**Mikrofon işləmir**
1. iPhone-da **Settings** › **Safari** › **Microphone** bölməsini açın və icazə verin (və ya **Settings** › **IELTS Mentor**).
2. Tətbiqə qayıdın və yenidən cəhd edin.
3. Mikrofon olmadan **Practice without recording** ilə yalnız taymerlə məşq edə bilərsiniz.

**Tarix səhv görünür**
1. **Settings** › **Dates and plan** bölməsini açın.
2. **Start date** və **Exam date** tarixlərini yoxlayın və **Save dates** basın.
