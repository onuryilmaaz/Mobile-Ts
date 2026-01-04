import { useState } from 'react';
import { View, Text, ScrollView, Switch, Platform } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { Ionicons } from '@expo/vector-icons';

type Surah = {
  number: number;
  name: string;
  arabic: string;
  transliteration: string;
  turkish: string;
};

const SURAHS: Surah[] = [
  {
    number: 1,
    name: 'Fil Suresi',
    arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nأَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ بِأَصْحَابِ الْفِيلِ\nأَلَمْ يَجْعَلْ كَيْدَهُمْ فِي تَضْلِيلٍ\nوَأَرْسَلَ عَلَيْهِمْ طَيْرًا أَبَابِيلَ\nتَرْمِيهِمْ بِحِجَارَةٍ مِنْ سِجِّيلٍ\nفَجَعَلَهُمْ كَعَصْفٍ مَأْكُولٍ',
    transliteration:
      'Bismillâhirrahmânirrahîm\nE lem tera keyfe feale rabbuke bi ashâbil fîl\nE lem yec\'al keydehum fî tadlîl\nVe ersele aleyhim tayran ebâbîl\nTermîhim bi hicâratin min siccîl\nFe cealehum ke asfin me\'kûl',
    turkish:
      'Rahmân ve Rahîm olan Allah\'ın adıyla.\nRabbinin, Fil sahiplerine ne yaptığını görmedin mi?\nOnların kötü planlarını boşa çıkarmadı mı?\nÜzerlerine sürü sürü kuşlar gönderdi.\nOnlara çamurdan sertleşmiş taşlar atıyorlardı.\nBöylece onları yenilmiş ekin yaprağı gibi yaptı.',
  },
  {
    number: 2,
    name: 'Kureyş Suresi',
    arabic:
      'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nلِإِيلَافِ قُرَيْشٍ\nإِيلَافِهِمْ رِحْلَةَ الشِّتَاءِ وَالصَّيْفِ\nفَلْيَعْبُدُوا رَبَّ هَٰذَا الْبَيْتِ\nالَّذِي أَطْعَمَهُمْ مِنْ جُوعٍ وَآمَنَهُمْ مِنْ خَوْفٍ',
    transliteration:
      'Bismillâhirrahmânirrahîm\nLi îlâfi kureyş\nÎlâfihim rıhletes şitâi ves sayf\nFel ya\'budû rabbe hâzel beyt\nEllezî et\'amehum min cû\'in ve âmenehum min havf',
    turkish:
      'Rahmân ve Rahîm olan Allah\'ın adıyla.\nKureyş\'in güvenliği için,\nKış ve yaz yolculuklarında güvenliği için,\nBu evin (Kâbe\'nin) Rabbine kulluk etsinler.\nO ki onları açlıktan doyurdu ve korkudan güvene kavuşturdu.',
  },
  {
    number: 3,
    name: 'Maun Suresi',
    arabic:
      'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nأَرَأَيْتَ الَّذِي يُكَذِّبُ بِالدِّينِ\nفَذَٰلِكَ الَّذِي يَدُعُّ الْيَتِيمَ\nوَلَا يَحُضُّ عَلَىٰ طَعَامِ الْمِسْكِينِ\nفَوَيْلٌ لِلْمُصَلِّينَ\nالَّذِينَ هُمْ عَنْ صَلَاتِهِمْ سَاهُونَ\nالَّذِينَ هُمْ يُرَاءُونَ\nوَيَمْنَعُونَ الْمَاعُونَ',
    transliteration:
      'Bismillâhirrahmânirrahîm\nE raeytellezî yukezzibu bid dîn\nFe zâlikellezî yedu\'ul yetîm\nVe lâ yehuddu alâ taâmil miskîn\nFe veylun lil musallîn\nEllezîne hum an salâtihim sâhûn\nEllezîne hum yurâûn\nVe yemneûnel mâûn',
    turkish:
      'Rahmân ve Rahîm olan Allah\'ın adıyla.\nDini yalanlayanı gördün mü?\nİşte o, yetimi itip kakar.\nYoksulu doyurmaya teşvik etmez.\nYazıklar olsun o namaz kılanlara ki,\nOnlar namazlarını ciddiye almazlar.\nOnlar gösteriş yaparlar.\nVe yardımlaşmayı engellerler.',
  },
  {
    number: 4,
    name: 'Kevser Suresi',
    arabic:
      'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nإِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ\nفَصَلِّ لِرَبِّكَ وَانْحَرْ\nإِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ',
    transliteration:
      'Bismillâhirrahmânirrahîm\nİnnâ a\'taynâkel kevser\nFe salli li rabbike venhar\nİnne şânieke huvel ebtar',
    turkish:
      'Rahmân ve Rahîm olan Allah\'ın adıyla.\nŞüphesiz biz sana Kevser\'i verdik.\nO halde Rabbin için namaz kıl ve kurban kes.\nAsıl sonu kesik olan, sana kin besleyendir.',
  },
  {
    number: 5,
    name: 'Kafirun Suresi',
    arabic:
      'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nقُلْ يَا أَيُّهَا الْكَافِرُونَ\nلَا أَعْبُدُ مَا تَعْبُدُونَ\nوَلَا أَنْتُمْ عَابِدُونَ مَا أَعْبُدُ\nوَلَا أَنَا عَابِدٌ مَا عَبَدتُّمْ\nوَلَا أَنْتُمْ عَابِدُونَ مَا أَعْبُدُ\nلَكُمْ دِينُكُمْ وَلِيَ دِينِ',
    transliteration:
      'Bismillâhirrahmânirrahîm\nKul yâ eyyuhel kâfirûn\nLâ a\'budu mâ ta\'budûn\nVe lâ entum âbidûne mâ a\'bud\nVe lâ ene âbidun mâ abedtum\nVe lâ entum âbidûne mâ a\'bud\nLekum dînukum ve liye dîn',
    turkish:
      'Rahmân ve Rahîm olan Allah\'ın adıyla.\nDe ki: "Ey kâfirler!\nBen sizin taptıklarınıza tapmam.\nSiz de benim taptığıma tapıcılar değilsiniz.\nBen de sizin taptıklarınıza tapacak değilim.\nSiz de benim taptığıma tapıcılar değilsiniz.\nSizin dininiz size, benim dinim bana."',
  },
  {
    number: 6,
    name: 'Nasr Suresi',
    arabic:
      'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nإِذَا جَاءَ نَصْرُ اللَّهِ وَالْفَتْحُ\nوَرَأَيْتَ النَّاسَ يَدْخُلُونَ فِي دِينِ اللَّهِ أَفْوَاجًا\nفَسَبِّحْ بِحَمْدِ رَبِّكَ وَاسْتَغْفِرْهُ ۚ إِنَّهُ كَانَ تَوَّابًا',
    transliteration:
      'Bismillâhirrahmânirrahîm\nİzâ câe nasrullâhi vel feth\nVe raeyten nâse yedhulûne fî dînillâhi efvâcâ\nFe sebbih bi hamdi rabbike vestagfirh, innehu kâne tevvâbâ',
    turkish:
      'Rahmân ve Rahîm olan Allah\'ın adıyla.\nAllah\'ın yardımı ve fetih geldiğinde,\nVe insanların bölük bölük Allah\'ın dinine girdiklerini gördüğünde,\nRabbini överek tesbih et ve O\'ndan bağışlanma dile. Çünkü O, tevbeleri çok kabul edendir.',
  },
  {
    number: 7,
    name: 'Tebbet Suresi',
    arabic:
      'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nتَبَّتْ يَدَا أَبِي لَهَبٍ وَتَبَّ\nمَا أَغْنَىٰ عَنْهُ مَالُهُ وَمَا كَسَبَ\nسَيَصْلَىٰ نَارًا ذَاتَ لَهَبٍ\nوَامْرَأَتُهُ حَمَّالَةَ الْحَطَبِ\nفِي جِيدِهَا حَبْلٌ مِنْ مَسَدٍ',
    transliteration:
      'Bismillâhirrahmânirrahîm\nTebbet yedâ ebî lehebin ve tebb\nMâ agnâ anhu mâluhu ve mâ keseb\nSeyaslâ nâren zâte leheb\nVemraetuhu hammâletel hatab\nFî cîdihâ hablun min mesed',
    turkish:
      'Rahmân ve Rahîm olan Allah\'ın adıyla.\nEbu Leheb\'in iki eli kurusun! Kurudu da.\nMalı ve kazandığı kendisine fayda vermedi.\nAlevli bir ateşe yaslanacak.\nKarısı da, odun hamalı (olacak).\nBoynunda bükülmüş bir ip olacak.',
  },
  {
    number: 8,
    name: 'İhlas Suresi',
    arabic:
      'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nقُلْ هُوَ اللَّهُ أَحَدٌ\nاللَّهُ الصَّمَدُ\nلَمْ يَلِدْ وَلَمْ يُولَدْ\nوَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ',
    transliteration:
      'Bismillâhirrahmânirrahîm\nKul huvallâhu ehad\nAllâhus samed\nLem yelid ve lem yûled\nVe lem yekun lehu kufuven ehad',
    turkish:
      'Rahmân ve Rahîm olan Allah\'ın adıyla.\nDe ki: "O Allah birdir.\nAllah Samed\'dir (her şey O\'na muhtaçtır, O hiçbir şeye muhtaç değildir).\nO doğurmamıştır ve doğurulmamıştır.\nVe hiçbir şey O\'nun dengi değildir."',
  },
  {
    number: 9,
    name: 'Felak Suresi',
    arabic:
      'بِسْمِ اللَّهِ الرَّحْمَٰnِ الرَّحِيمِ\nقُلْ أَعُوذُ بِرَبِّ الْفَلَقِ\nمِنْ شَرِّ مَا خَلَقَ\nوَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ\nوَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ\nوَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ',
    transliteration:
      'Bismillâhirrahmânirrahîm\nKul eûzu bi rabbil felak\nMin şerri mâ halak\nVe min şerri gâsikın izâ vekab\nVe min şerrin neffâsâti fil ukad\nVe min şerri hâsidin izâ hased',
    turkish:
      'Rahmân ve Rahîm olan Allah\'ın adıyla.\nDe ki: "Sabahın Rabbine sığınırım.\nYarattığı şeylerin şerrinden,\nKaranlığı çöktüğünde gecenin şerrinden,\nDüğümlere üfleyen büyücülerin şerrinden,\nVe haset ettiğinde hasetçinin şerrinden."',
  },
  {
    number: 10,
    name: 'Nas Suresi',
    arabic:
      'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nقُلْ أَعُوذُ بِرَبِّ النَّاسِ\nمَلِكِ النَّاسِ\nإِلَٰهِ النَّاسِ\nمِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ\nالَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ\nمِنَ الْجِنَّةِ وَالنَّاسِ',
    transliteration:
      'Bismillâhirrahmânirrahîm\nKul eûzu bi rabbin nâs\nMelikin nâs\nİlâhin nâs\nMin şerril vesvâsil hannâs\nEllezî yuvesvisu fî sudûrin nâs\nMinel cinneti ven nâs',
    turkish:
      'Rahmân ve Rahîm olan Allah\'ın adıyla.\nDe ki: "İnsanların Rabbine sığınırım.\nİnsanların Melik\'ine (mutlak sahip ve hakimine),\nİnsanların İlah\'ına,\nHannâs (şeytan)ın şerrinden,\nO ki insanların göğüslerine (kötü düşünceler) fısıldar.\nGerek cinlerden, gerek insanlardan."',
  },
];

export default function PrayerSurahsScreen() {
  const [showTurkish, setShowTurkish] = useState(true);

  return (
    <Screen className="bg-slate-50">
      <View className="mb-4 flex-row items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
        <View className="flex-1">
          <Text className="text-base font-semibold text-slate-900">Türkçe Çeviri</Text>
          <Text className="mt-0.5 text-xs text-slate-500">Türkçe çeviriyi göster/gizle</Text>
        </View>
        <Switch
          value={showTurkish}
          onValueChange={setShowTurkish}
          trackColor={{ false: '#cbd5e1', true: '#0d9488' }}
          thumbColor={showTurkish ? '#fff' : '#f1f5f9'}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {SURAHS.map((surah) => (
          <View
            key={surah.number}
            className="mb-4 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <View className="bg-gradient-to-r from-teal-50 to-emerald-50 px-4 py-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-teal-600">
                    <Text className="text-sm font-bold text-white">{surah.number}</Text>
                  </View>
                  <Text className="text-lg font-bold text-slate-900">{surah.name}</Text>
                </View>
                <Ionicons name="book-outline" size={20} color="#0f766e" />
              </View>
            </View>

            <View className="p-4">
              <View className="mb-4">
                <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Arapça
                </Text>
                <Text className="text-right text-lg leading-8 text-slate-900" style={{ lineHeight: 32 }}>
                  {surah.arabic}
                </Text>
                <View
                  className="mt-4 overflow-hidden rounded-xl border border-teal-200 bg-teal-50"
                  style={{
                    padding: Platform.OS === 'android' ? 16 : 16,
                    ...(Platform.OS === 'android' && {
                      elevation: 1,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                    }),
                  }}>
                  <View className="mb-3 flex-row items-center gap-2">
                    <View
                      className="h-7 w-7 items-center justify-center rounded-full"
                      style={{ backgroundColor: Platform.OS === 'android' ? '#0d9488' : '#ccfbf1' }}>
                      <Ionicons
                        name="volume-high-outline"
                        size={Platform.OS === 'android' ? 16 : 14}
                        color={Platform.OS === 'android' ? '#ffffff' : '#0d9488'}
                      />
                    </View>
                    <Text
                      className="font-bold uppercase tracking-wider"
                      style={{
                        fontSize: Platform.OS === 'android' ? 11 : 12,
                        color: Platform.OS === 'android' ? '#0f766e' : '#0d9488',
                      }}>
                      Latin Alfabesiyle Okunuş
                    </Text>
                  </View>
                  <Text
                    className="text-left font-medium text-slate-800"
                    style={{
                      fontSize: Platform.OS === 'android' ? 16 : 15,
                      lineHeight: Platform.OS === 'android' ? 26 : 28,
                      fontStyle: 'italic',
                      letterSpacing: Platform.OS === 'android' ? 0.2 : 0,
                    }}>
                    {surah.transliteration}
                  </Text>
                </View>
              </View>

              {showTurkish && (
                <View className="border-t border-slate-100 pt-4">
                  <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Türkçe Çeviri
                  </Text>
                  <Text className="text-left text-base leading-6 text-slate-700">{surah.turkish}</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

