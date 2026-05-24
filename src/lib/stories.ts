export type Story = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readingTime: string;
  tags: string[];
  content: string;
};

export const stories: Story[] = [
  {
    slug: "from-aizu-to-nvidia",
    title: "Vài ghi chép về văn hoá Big Tech — và cách mình học để không bị cuốn đi",
    excerpt:
      "Không phải bí kíp đậu phỏng vấn. Chỉ là một vài quan sát rất cá nhân về văn hoá ở các công ty công nghệ lớn — và những thứ giúp mình đứng vững khi mới vào.",
    date: "2026-04-12",
    readingTime: "6 min",
    tags: ["Career", "Big Tech", "Reflection"],
    content: `
Lần đầu mình bước chân vào một công ty công nghệ lớn, cảm giác giống như đi lạc vào một thành phố mà mình không biết tiếng. Mọi người xung quanh nói cùng ngôn ngữ với mình, dùng cùng IDE với mình — nhưng có một thứ gì đó *khác*. Một nhịp khác, một cách nghĩ khác.

Phải mất khá lâu mình mới gọi tên được cái "khác" đó. Và mất lâu hơn nữa để học cách sống chung với nó mà không đánh mất chính mình.

Bài viết này không phải là bí kíp. Chỉ là vài điều mình quan sát được, mong hữu ích cho bạn nào đang chuẩn bị bước chân vào — hoặc đang loay hoay tự hỏi liệu mình có thuộc về nơi đây không.

---

## 1. Mọi quyết định đều phải có lý do

Văn hoá đầu tiên mình bị "shock" là chuyện viết design doc. Một thay đổi tưởng nhỏ — sửa một field DB, đổi một config — cũng có thể yêu cầu vài trang giấy giải thích: *vì sao*, *trade-off nào đã cân nhắc*, *plan rollback ra sao*.

Lúc đầu mình khó chịu lắm. Mình nghĩ: code chạy được là xong rồi, viết dài làm gì.

Sau này mới hiểu: ở scale lớn, một quyết định nhỏ có thể kéo theo nhiều hệ quả mình không thấy ngay. **Viết rõ lý do không phải để khoe — mà để 6 tháng sau, khi có người hỏi "tại sao chỗ này lại làm thế này?", vẫn còn một câu trả lời tử tế.**

Cách vượt qua: tập thói quen viết ra suy nghĩ của mình *trước khi* code. Không cần đẹp, không cần dài. Chỉ cần đủ để chính mình tuần sau đọc lại còn hiểu.

## 2. Im lặng không phải là khiêm tốn

Người Việt mình hay được dạy: "biết thì thưa thốt, không biết thì dựa cột mà nghe". Mang thói quen đó vào một môi trường nhiều thảo luận, mình rất dễ im lặng quá mức.

Mình từng ngồi cả buổi meeting không nói câu nào, không phải vì không hiểu — mà vì sợ nói sai. Sau đó manager nhắn riêng: *"Anh nghĩ gì về cái đó? Anh không nói, mọi người không biết anh có đồng ý hay không."*

Cú đó đau. Nhưng đó là bài học lớn: **không nói ra thì mọi người khó biết mình đang nghĩ gì**. Thường người ta không cần mình nói thật hay; họ cần mình tham gia đủ để cùng làm rõ vấn đề.

Cách vượt qua: bắt đầu từ những câu nhỏ. *"Em chưa hiểu chỗ X, mọi người giải thích lại được không?"* — câu đơn giản nhưng cực kỳ giá trị. Nó không thể hiện sự yếu, mà thể hiện sự engaged.

## 3. Fail không sao, fail im lặng thì có

Ở các môi trường công nghệ lớn, người ta hay nói với bạn: *"It's OK to fail."* Và đúng là vậy. Production incident, missed deadline, bad design — tất cả đều có thể tha thứ.

Cái khó xử lý nhất là: **fail mà không học ra cái gì**, hoặc tệ hơn — **fail mà không nói cho ai biết**.

Mình từng deploy một thứ gây ra sự cố. Phản ứng đầu tiên của mình là... cố tự fix âm thầm. Đó là sai lầm lớn nhất ngày hôm đó. Khi sự việc ra ánh sáng (vì kiểu gì cũng ra), điều khiến mọi người bực không phải là cái lỗi — mà là việc mình giấu.

Cách vượt qua: khi có sự cố, **mở chat team trong vòng 5 phút**. Một câu thôi: *"Em đang điều tra, có vẻ liên quan đến X, sẽ update lại trong 30 phút."* Vậy là đủ. Văn hoá blameless postmortem có thật, nhưng chỉ áp dụng khi bạn lên tiếng kịp thời.

## 4. Promo không phải mục tiêu, mà là hệ quả

Các công ty lớn có job ladder khá rõ: SWE → Senior → Staff → Principal. Nhiều bạn vào với mục tiêu *"trong X năm phải lên Senior"*. Mình hiểu, vì mình cũng từng nghĩ khá nhiều về chuyện đó.

Nhưng sau khi quan sát nhiều người được ghi nhận (và nhiều người chưa được), mình dần thấy:

> Những người được promo nhanh không phải vì họ chạy đua promo. Họ được promo vì họ làm tốt việc của cấp tiếp theo — *trước khi* được giao chức danh đó.

Người chạy đua promo thường dễ bị "stuck", vì họ chọn việc dễ ghi điểm thay vì việc đúng. Người làm việc đúng thường được ghi nhận chậm hơn một chút, nhưng bền hơn.

Cách vượt qua: ngừng nhìn vào job ladder mỗi tháng. Thay vào đó, mỗi quý tự hỏi: *"Mình đã giúp được ai chưa? Mình đã giải quyết được vấn đề gì lớn hơn scope của mình chưa?"*

## 5. Bạn không phải là việc của bạn

Đây có lẽ là bài học mình mất nhiều thời gian nhất để học.

Các môi trường lớn rất giỏi trong việc khiến bạn tin rằng *bạn = chức danh = công ty*. Lương cao, badge đẹp, brand thơm. Đến lúc bị layoff, hoặc tự nguyện rời đi, hoặc đơn giản là dự án bị cancel — bạn sẽ bị rung lắc tới tận gốc.

Mình đã thấy nhiều người (cả nước ngoài và VN) khi mất job ở những nơi như vậy là mất luôn cả identity. Mất ngủ, mất tự tin, mất kết nối với bạn bè.

Cách vượt qua: **xây identity của mình ngoài công việc**. Một sở thích. Một cộng đồng. Một dự án phụ. Một mối quan hệ. Bất cứ thứ gì khiến bạn vẫn còn là chính bạn — kể cả khi mai bạn không còn ID badge nữa.

---

## Một câu cuối

Môi trường công nghệ lớn không phải thiên đường, cũng không phải địa ngục. Nó là một môi trường — như bao môi trường khác. Có người hợp, có người không. Có giai đoạn thăng, có giai đoạn trầm.

Nếu bạn đang trên đường vào, đừng quá hồi hộp. Nếu bạn đã ở trong, đừng quên ngẩng đầu nhìn xung quanh thỉnh thoảng.

Và quan trọng nhất — gọi điện về cho mẹ. Cái này luôn đúng, dù ở đâu.
    `.trim(),
  },
  {
    slug: "co-founder-engineerpro",
    title: "Vì sao mình bắt đầu EngineerPro",
    excerpt:
      "Không có gì to tát. Chỉ là mình từng vất vả với mấy vòng phỏng vấn kỹ thuật, và muốn các bạn đi sau bớt vất vả hơn một chút.",
    date: "2026-03-20",
    readingTime: "4 min",
    tags: ["EngineerPro", "Mentorship"],
    content: `
Mình nhớ rất rõ lần đầu phỏng vấn ở một công ty công nghệ lớn. Câu hỏi không quá khó. Mình cũng đã ôn tập. Nhưng vào phòng, tay run, nói lắp, tư duy đứt đoạn — và rớt.

Sau đó, mình rớt thêm vài vòng nữa, ở vài công ty khác.

Mỗi lần rớt, cái mất lớn nhất không phải là offer. Là sự **tự tin**. Là cái cảm giác: *"Hay là mình không đủ giỏi cho ngành này thật?"*

Mình biết rất nhiều bạn cũng đang ở chính cái cảm giác đó lúc này.

---

## Cái thiếu không phải là kiến thức

Khi nhìn lại, mình nhận ra: phần lớn lúc rớt phỏng vấn, không phải vì mình không biết. Mà vì:

- Mình không biết **người phỏng vấn đang tìm gì** ở câu trả lời.
- Mình không biết **format giao tiếp** trong các vòng phỏng vấn kỹ thuật.
- Mình không biết **bẫy phỏng vấn** thường gặp — thứ mà chỉ ai từng phỏng vấn bên kia bàn mới biết.
- Mình không có ai để **practice** với, để **được sửa**, để **được cho biết là sai ở đâu**.

Đó là một cái thiếu rất cụ thể. Và đó là cái thiếu mà — sau vài năm đi làm và phỏng vấn nhiều người — mình tin tụi mình có thể giúp được một phần.

## Tại sao là EngineerPro

[EngineerPro](https://engineerprogurus.com/) bắt đầu rất nhỏ. Một vài anh em từng đi qua các công ty công nghệ ngồi lại với nhau, đều cùng một câu hỏi:

> "Hồi đó, nếu có người chỉ cho tụi mình mấy thứ này sớm hơn, thì tụi mình đã đỡ vất vả bao nhiêu nhỉ?"

Không có gì lớn lao hơn thế. Tụi mình không nghĩ mình giỏi nhất, cũng không nghĩ là người duy nhất có thể dạy. Chỉ là — tụi mình đã đi qua, và muốn các bạn đi sau bớt mò mẫm.

## Tụi mình tập trung vào gì

Đơn giản: giúp các bạn **chuẩn bị tốt hơn cho các vòng phỏng vấn kỹ thuật**. Cụ thể:

- **DSA / Coding**: không phải cày 500 bài Leetcode, mà luyện theo **pattern** để khi gặp bài lạ, vẫn nhận ra được.
- **System Design**: tập cách suy nghĩ trade-off, cách giao tiếp ý tưởng trong 45 phút.
- **CS Fundamentals**: ôn lại những thứ căn bản mà phỏng vấn hay hỏi (OS, network, DB).
- **Mock interview**: thứ này quan trọng nhất. Practice trong môi trường giống thật, được mentor chỉ ra điểm yếu để sửa.

Tất cả đều là những thứ mình **ước có người chỉ cho mình hồi xưa**.

---

## Một câu mộc

Mình không nghĩ EngineerPro thay đổi được ngành. Mục tiêu nhỏ hơn nhiều: nếu một bạn đọc được story này, đi phỏng vấn bớt run một chút, biết bẫy nào để tránh, biết câu nào nên hỏi lại — thì với tụi mình đã là đủ.

Nếu bạn đang chuẩn bị phỏng vấn và thấy lạc lối — cứ nhắn tụi mình một câu. Không phải để bán khoá học. Chỉ để chỉ đường, như cách ngày xưa có người đã chỉ cho tụi mình.
    `.trim(),
  },
  {
    slug: "gap-lai-hoc-tro-trong-phong-van",
    title: "Một lần shadow phỏng vấn, gặp lại học trò cũ",
    excerpt:
      "Có những khoảnh khắc mà bao nhiêu công sức giảng dạy bỗng nhiên có ý nghĩa rất rõ. Với mình, đó là khi ngồi im quan sát học trò cũ pass System Design ngay trước mặt.",
    date: "2026-02-22",
    readingTime: "5 min",
    tags: ["Mentorship", "System Design", "Reflection"],
    content: `
Có những khoảnh khắc mà sau nhiều năm đi làm, mỗi khi nhớ lại mình vẫn thấy một thứ cảm xúc rất đặc biệt — vừa vui, vừa tự hào, vừa thấy công việc giảng dạy của mình bỗng có ý nghĩa rõ ràng.

Một trong những khoảnh khắc đó xảy ra cuối 2024, khi mình mới chuyển sang một công ty mới.

---

## Ngồi im trong một góc

Hôm đó mình tham gia một buổi phỏng vấn tuyển dụng, nhưng không phải vai trò chính. Mình chỉ là **shadow interviewer** — người quan sát, ngồi lặng một góc, không hỏi, không chấm điểm. Một vị trí "đứng ngoài" hoàn toàn.

Ứng viên bước vào, và mình nhận ra bạn — một học viên cũ của khoá **System Design** mà mình và mấy anh em (anh Việt, anh Hoà) từng giảng dạy trước đó.

Cảm giác trong khoảnh khắc ấy khó tả. Vừa vui vì gặp lại học trò sau một thời gian, trong một bối cảnh khác hẳn. Vừa hồi hộp — *"Nếu bạn làm không tốt, liệu mọi thứ có khó xử không?"*

## Cửa ải System Design

Buổi phỏng vấn diễn ra bình thường — câu hỏi về kỹ thuật, về kinh nghiệm, về tình huống thực tế. Mình ngồi đó, lặng lẽ quan sát.

Mọi thứ trôi qua bình thường cho đến phần khó nhất — **System Design**. Đây luôn là cửa ải mà nhiều bạn ngại, vì nó không chỉ đo kiến thức, mà còn thử **khả năng tư duy hệ thống, giao tiếp, và cách dẫn dắt vấn đề**.

Bài toán được đưa ra. Và đó là lúc mình thấy sự khác biệt.

Bạn bắt đầu từng bước rất chắc chắn:

- **Đặt câu hỏi để làm rõ yêu cầu trước**. Về quy mô, về mục tiêu hệ thống, về các ràng buộc cần cân nhắc. Cách tiếp cận này vừa cho thấy sự cẩn thận, vừa thể hiện khả năng nhìn vấn đề từ nhiều góc độ.
- **Chia nhỏ bài toán** và xây từng tầng kiến trúc. Mỗi bước, bạn đều giải thích vì sao chọn phương án này, ưu nhược điểm là gì, và sẽ mở rộng thế nào khi hệ thống lớn lên.
- **Duy trì sự mạch lạc**. Có lúc cần dừng lại suy nghĩ, nhưng không hề mất bình tĩnh, không bị cuốn vào những chi tiết vụn vặt.

Mình thấy rất rõ: những thứ bạn học trong khoá học không còn là lý thuyết. Nó đã trở thành **kỹ năng thực chiến**. Bạn dùng nó một cách tự nhiên, không gượng gạo, không học vẹt.

## Người thầy ngồi ngoài sân khấu

Ngồi ở vị trí quan sát, mình không thể giúp được gì. Nhưng trong lòng thấy nhẹ nhõm.

Giống như một người thầy ngồi ngoài sân khấu, chứng kiến học trò tự tin biểu diễn. Biết rằng mình chỉ góp một phần rất nhỏ trong hành trình của bạn — nhưng cũng đủ để thấy ấm áp.

Buổi phỏng vấn kết thúc. Mình không phải người chấm điểm, nhưng nhìn ánh mắt hài lòng của interviewer chính, mình biết bạn đã để lại ấn tượng tốt.

Khoảng hai tuần sau, mình nhận được tin nhắn:

> *"Anh ơi, em pass rồi. Em vừa nhận offer!"*

Đọc xong, mình ngồi yên một lúc. Không hẳn vui kiểu reo lên — mà vui kiểu **âm thầm, biết rằng có thứ gì đó đã trọn vẹn**.

---

## Một niềm tin nhỏ được củng cố

Câu chuyện đó cho mình một niềm tin: **System Design không phải để trang trí CV, cũng không phải để học cho có**. Nó là một chiếc chìa khoá thực sự — giúp ứng viên vượt qua vòng phỏng vấn khó nhất, nơi đòi hỏi không chỉ kiến thức, mà cả tư duy, khả năng trình bày, và sự bình tĩnh xử lý tình huống.

Và hơn thế, System Design giúp các bạn kỹ sư chứng minh rằng mình **không chỉ biết code** — mà còn hiểu và làm chủ cách hệ thống lớn vận hành. Một tố chất mà công ty nào cũng đang tìm.

Mỗi khi nhớ lại ngày hôm đó, mình vẫn thấy rõ hình ảnh bạn ngồi trước mặt, từng bước giải đề với giọng nói chắc chắn và ánh mắt tập trung. Một buổi phỏng vấn rất bình thường. Nhưng với mình, đó là khoảnh khắc mà công sức của cả thầy lẫn trò được đền đáp.

Và là khoảnh khắc nhắc mình rằng — đôi khi, một khoá học **nếu học đúng cách và áp dụng trọn vẹn** — có thể trở thành bệ phóng cho cả một giai đoạn mới trong sự nghiệp của ai đó.
    `.trim(),
  },
  {
    slug: "pass-coding-fail-behavior",
    title: "Behavioral interview — phần nhỏ nhưng dễ bị xem nhẹ",
    excerpt:
      "Mình gặp khá nhiều case bạn rất giỏi code, system design ổn, nhưng vẫn lỡ offer chỉ vì vòng behavioral. Vài quan sát rất cá nhân, mong hữu ích.",
    date: "2026-02-03",
    readingTime: "5 min",
    tags: ["Interview", "Behavioral", "Reflection"],
    content: `
Có một điều mình hay quan sát thấy khi đi phỏng vấn người khác: **không ít bạn trượt không phải vì code, mà vì vòng behavioral**.

Mình từng nghĩ điều này chỉ xảy ra với các bạn mới ra trường. Nhưng có những case mình gặp, ứng viên đã đi làm khá lâu, từng qua những môi trường lớn, mà vẫn lỡ vòng này. Và mỗi lần như vậy, mình lại tự hỏi: tại sao một kỹ năng quan trọng như thế lại dễ bị xem nhẹ?

---

## Kịch bản lặp đi lặp lại

Qua những buổi mình tham gia phỏng vấn ứng viên — cả với vai trò interviewer, cả khi đi mentor — mình thấy một pattern rất quen:

- Các bạn dành **80–90% thời gian ôn thuật toán và system design**.
- Phần behavioral, nếu có ôn, thì rất hời hợt — kiểu *"tới đâu trả lời tới đó"*.

Rồi khi vào phỏng vấn, gặp những câu nghe tưởng đơn giản:

> *"Hãy kể về một lần bạn phải làm việc với một đồng nghiệp khó tính."*
>
> *"Khi bạn gặp một mâu thuẫn trong team, bạn xử lý thế nào?"*
>
> *"Một lần bạn phải đưa ra quyết định khó khăn, kết quả ra sao?"*

Câu hỏi nhẹ nhàng, nhưng đa phần ứng viên trả lời lan man, thiếu cấu trúc, hoặc rơi vào trạng thái kể quá nhiều về cái tôi cá nhân. Các bạn quên rằng phỏng vấn không phải nơi để *freestyle*. Người phỏng vấn muốn thấy **logic, sự tự nhận thức, khả năng self-reflection, và cách xử lý vấn đề có hệ thống**.

## Một ví dụ: Amazon

Mình hay nói với các bạn mentee: **phỏng vấn cũng giống đi thi đại học** — không thể chỉ học mỗi Toán rồi bỏ qua Lý, Hóa mà mong đỗ. Behavioral chính là một trong những "môn thi" như vậy.

Đặc biệt ở những công ty như Amazon. Họ nổi tiếng với 17 Leadership Principles. Không phải để học thuộc lòng, mà để luyện cách trả lời sao cho phản ánh đúng trải nghiệm thực của mình. Nếu không chuẩn bị, **rất dễ bị "soi" ra ngay từ câu hỏi đầu**.

Trong số các bạn mình từng quan sát, hiếm ai pass được phần này nếu chỉ dựa vào "ứng biến tại chỗ".

## "Em nói thật là được rồi mà?"

Đây là câu mình nghe nhiều nhất:

> *"Em giỏi code rồi, behavioral chỉ cần nói thật thôi, chắc không sao đâu."*

Sự thật thì **nói thật không đủ**. Bạn cần:

- **Chọn đúng câu chuyện** — không phải câu chuyện nào cũng phù hợp với câu hỏi.
- **Trả lời theo cấu trúc** — STAR (Situation–Task–Action–Result) hoặc PARA. Nghe khô khan, nhưng giúp người phỏng vấn theo dõi được.
- **Thể hiện chính mình mà không biến buổi phỏng vấn thành buổi tự sự**.

Chỉ khi làm được như vậy, người phỏng vấn mới thấy bạn là **người có tư duy hệ thống, có khả năng giao tiếp** — chứ không chỉ là một coder giỏi.

## 3 lời khuyên rất thật

1. **Nhìn thẳng vào điểm yếu.** Nếu bạn đã mạnh về technical, hãy bớt thời gian cho phần đó và dành cho behavioral.
2. **Đừng xem nhẹ.** Behavioral khó hơn bạn nghĩ. Nó hoàn toàn có thể khiến bạn mất cơ hội, kể cả khi code của bạn rất mượt.
3. **Có người luyện cùng thì tốt hơn.** Mock interview với người đã từng đi qua những vòng này — hoặc đã ngồi phỏng vấn người khác — giúp bạn tiết kiệm rất nhiều thời gian, và tránh được những thất bại không đáng.

## Một quan sát cuối

Thực tế, mình thấy hầu hết các bạn chỉ thật sự nghiêm túc với behavioral **sau khi đã trượt vài lần**. Mình có thể nhắc nhở bao nhiêu cũng được, nhưng chỉ khi tự mình trải qua thất bại, các bạn mới thấm.

Và sau khi thấm rồi, các bạn luyện tập kỹ hơn, có hệ thống hơn — rồi đạt kết quả tốt.

Sau một thời gian đi mentor, điều khiến mình vui nhất không phải là kết quả cụ thể, mà là **những khoảnh khắc các bạn tự tin hơn khi nói về chính mình** — biết nhìn lại, biết cải thiện từng kỹ năng nhỏ, kể cả những kỹ năng tưởng chừng vụn vặt như behavioral.

Vì với mình, kỹ năng này không chỉ giúp bạn vượt qua phỏng vấn. Nó giúp bạn trở thành một kỹ sư, một đồng nghiệp, và một người lãnh đạo tốt hơn.
    `.trim(),
  },
];

export function getStoryBySlug(slug: string): Story | undefined {
  return stories.find((s) => s.slug === slug);
}

export function getAllStorySlugs(): string[] {
  return stories.map((s) => s.slug);
}
