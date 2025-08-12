// كتابة المعرفات الفريدة المسلسلة في Google Sheets
import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';

export async function writeUniqueIdsToSheets() {
  try {
    console.log('🔑 بدء كتابة المعرفات الفريدة في Google Sheets...');
    
    // بيانات المصادقة المحدثة
    const credentials = {
      type: "service_account",
      project_id: "cortoba-supp-sys",
      private_key_id: "75c0919d127eca6b97f7beece4b9f5c2b9bb5ba8",
      private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDLRiY5TEiNxTqU\nSKp94TnwbJh4L+bc8WylNB7qeXqFF8+obb1ErPy8kfq21vLRZNM7bY6R8zT+R96O\n+lFgemZrCg98jI9eZo/z2sdZZ8sBowGQpOC2S/+1bnqVtR/uBr5lSZNTXdxd0NBL\nRqSUrY79C7e5xBYQ/k60sRv3cGvwu0p2yuflca5Nq8B8ONCDTKdXMZNLyf3LYc2o\nXXDH4j+RdGkS7OAj3dUMYSt4yUa923ERYaSoaUkuUxyxy40c205MFkzPQRfcU3f4\nsoDLGcXq90lj5HvMkO9iFc6rXJoLAsKYkwBOQrabOIADw8snPXOxy0Pg4DAnbFX6\nkZ28acaVAgMBAAECggEABuzMNJDYD+xeLdsOjodJFVsTE//Ib6fR5GGS2WNrZx6u\ni7W2svY/DfWIgwjDm5qXD6Pl2Cxe681q/u1MLxXnE1JzwJx77eK0mMF6n8hyGWDX\nls6R0TlkQWa9dQgx9Eaf3zd9y2NGifOpL5yn0rYu9DPyqGN5FPnKQ0xIAEqrgrdE\ncwAvDiJ9jtj/7hUtL9E/Py3awxtqGrqfqAWyDMhlwqkPpQ/Ci9UT5LPGKU6PgGDA\nzOUNh0N3zreN4zjHaKGezdW+9wVAGkuJKOu4JtOkU6SJvKyQt4wHzrglQNjkl65C\nfCZl9ci9YTr+UD24LhAiA8yyQ9IYrDWn5dCeELjaAQKBgQD4L5wDoRvkPi42e3qg\n+sOpxiErPhyHl4keYW+DMPulad8qgXF+WUc5A9youEzj6D0EiXI0OrxuKw7Bhwkl\nbuisoLWeENsf8Djsa+xtDwwm+1IEIXi8xpVYhH83OY+o06Mw3JEB2K+Ci6SG0AUf\nFtzhvk02XSNQSfTF01K0Dke3wQKBgQDRrIwkl+/aQ/DzrDm4oWexdZJwWgWJESKi\nlx0Vb8nMVNFx2JBLmAcV1B4OvmpoAFHsr5/3/3x/pRa6Zk6GZluSrE7u3bbd6Hna\nTtUW4eo/2XR+/HFlbAWZwsNQAvHZ1gsBv+GlnT5zNE2fs4zI1KQigiAtGg4mnTga\n4KHDsD6j1QKBgHnfNyd5F68u8ZaDcCZYvXhC+Mq5R102BnlKs22iwg/qO1IuGkNH\nJ/hRcyvOxMMtqbjunYwUQ699qVNTMiSVn+AVUtn5wQCf//Po00KCnx8NTqsEnLtm\ncLP07Ft8ApWOx5YY2YQkmZrrY7FnuPwZSAH6ZwQJHGwyxOXX7cbJNGKBAoGAMqh3\nq5ex8ZActSLVR1Bn1y5K1S5KzBUBwzqzYiyCGwYbHGBwbHMssw9uu60x1DLPmFnO\nUoK9t7FRTnPNYRd15HgREhErT24NkrsdLMwkZozJYqznUNPKfp3ZxokPmcvnGOMd\nR4A4SGlIn98nkpYdmeDKmVsENDwkBAplyvvYBokCgYEA9uA3IUMaZ5G5KHgA+C4F\nmU+pwnOGs60BLTgK+EUXaUQ4f0HDsqCz0UXrI146bWW1sxU4TyddNUscc4SX/60k\nU86A4nrFQk0FkIcrhFS9KYkuWzqgBuY1N8AmgfI7tRIaqsRXb0281uhHmyN1MGBT\nx78kvtrLVv33tSBmTfs2m3k=\n-----END PRIVATE KEY-----\n",
      client_email: "cortoba-sys@cortoba-supp-sys.iam.gserviceaccount.com",
      client_id: "108486641505877917440",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/cortoba-sys%40cortoba-supp-sys.iam.gserviceaccount.com",
      universe_domain: "googleapis.com"
    };

    const auth = new GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1TuNmhUQSLCIJjyPKRGEX5WwCIlwgePdN5kBLkPSNGqg';

    console.log('📊 قراءة البيانات من Google Sheets...');
    
    // قراءة البيانات الحالية من Google Sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'DATA!A:E'
    });

    const rows = response.data.values || [];
    console.log(`📋 تم العثور على ${rows.length} صف في Google Sheets`);

    // إنشاء المعرفات الفريدة المسلسلة
    const updatedRows = rows.map((row, index) => {
      if (index === 0) {
        // العنوان
        return ['معرف الصنف', ...row.slice(1)];
      } else {
        // البيانات - إنشاء معرف فريد مسلسل
        const uniqueId = `P-${index.toString().padStart(7, '0')}`;
        return [uniqueId, ...row.slice(1)];
      }
    });

    console.log(`📝 كتابة ${updatedRows.length - 1} معرف فريد في العمود A...`);

    // كتابة البيانات المحدثة مع المعرفات الفريدة
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: 'DATA!A:E',
      valueInputOption: 'RAW',
      requestBody: {
        values: updatedRows
      }
    });

    console.log('✅ تم كتابة المعرفات الفريدة بنجاح في Google Sheets!');
    console.log(`🆔 المعرفات من P-0000001 إلى P-${(updatedRows.length - 1).toString().padStart(7, '0')}`);
    
    return {
      success: true,
      totalIds: updatedRows.length - 1,
      firstId: 'P-0000001',
      lastId: `P-${(updatedRows.length - 1).toString().padStart(7, '0')}`
    };

  } catch (error) {
    console.error('❌ خطأ في كتابة المعرفات الفريدة:', error);
    return {
      success: false,
      error: error.message
    };
  }
}