package app.niva.mobile.securemessages

import android.security.keystore.KeyGenParameterSpec
import android.system.Os
import android.security.keystore.KeyProperties
import android.util.Base64
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

/**
 * Minimal encrypted-at-rest message store.
 *
 * The database file contains only an AES-GCM encrypted JSON payload. The AES
 * key is non-exportable and protected by Android Keystore. If decryption or
 * key access fails, operations fail closed; the module never falls back to
 * plaintext storage.
 */
class NivaSecureMessagesModule : Module() {
  companion object {
    private const val KEY_ALIAS = "niva.sms.store.v1"
    private const val FILE_NAME = "niva_messages.enc"
    private const val TRANSFORMATION = "AES/GCM/NoPadding"
    private const val ANDROID_KEYSTORE = "AndroidKeyStore"
    private const val TAG_BITS = 128
  }

  private val lock = Any()

  override fun definition() = ModuleDefinition {
    Name("NivaSecureMessages")

    AsyncFunction("encryptAndStoreMessage") { message: Map<String, Any?> ->
      synchronized(lock) {
        val id = message["id"] as? String ?: throw IllegalArgumentException("id is required")
        val address = message["address"] as? String ?: throw IllegalArgumentException("address is required")
        val body = message["body"] as? String ?: throw IllegalArgumentException("body is required")
        require(id.isNotBlank() && address.isNotBlank() && body.isNotBlank()) { "Message fields must not be blank" }
        val date = (message["date"] as? Number)?.toLong() ?: System.currentTimeMillis()
        val database = readDatabase()
        val record = JSONObject()
          .put("id", id)
          .put("address", address)
          .put("body", body)
          .put("date", date)
        database.put(id, record)
        writeDatabase(database)
        mapOf("stored" to true, "id" to id)
      }
    }

    AsyncFunction("getDecryptedMessage") { id: String ->
      synchronized(lock) {
        require(id.isNotBlank()) { "id is required" }
        val record = readDatabase().optJSONObject(id) ?: return@AsyncFunction null
        mapOf(
          "id" to record.getString("id"),
          "address" to record.getString("address"),
          "body" to record.getString("body"),
          "date" to record.getLong("date")
        )
      }
    }

    AsyncFunction("deleteMessage") { id: String ->
      synchronized(lock) {
        require(id.isNotBlank()) { "id is required" }
        val database = readDatabase()
        val existed = database.has(id)
        database.remove(id)
        if (existed) writeDatabase(database)
        existed
      }
    }

    Function("getStorageStatus") {
      mapOf("available" to true, "encryption" to "AES-256-GCM", "keyProtection" to "Android Keystore")
    }
  }

  private fun storageFile(): File {
    val context = appContext.reactContext ?: error("React context unavailable")
    return File(context.filesDir, FILE_NAME)
  }

  private fun secretKey(): SecretKey {
    val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE).apply { load(null) }
    val existing = keyStore.getKey(KEY_ALIAS, null) as? SecretKey
    if (existing != null) return existing

    val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEYSTORE)
    generator.init(
      KeyGenParameterSpec.Builder(
        KEY_ALIAS,
        KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
      )
        .setKeySize(256)
        .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
        .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
        .setRandomizedEncryptionRequired(true)
        .build()
    )
    return generator.generateKey()
  }

  private fun readDatabase(): JSONObject {
    val file = storageFile()
    if (!file.exists()) return JSONObject()
    val envelope = JSONObject(file.readText(Charsets.UTF_8))
    val iv = Base64.decode(envelope.getString("iv"), Base64.NO_WRAP)
    val ciphertext = Base64.decode(envelope.getString("ciphertext"), Base64.NO_WRAP)
    val cipher = Cipher.getInstance(TRANSFORMATION)
    cipher.init(Cipher.DECRYPT_MODE, secretKey(), GCMParameterSpec(TAG_BITS, iv))
    return JSONObject(String(cipher.doFinal(ciphertext), Charsets.UTF_8))
  }

  private fun writeDatabase(database: JSONObject) {
    val cipher = Cipher.getInstance(TRANSFORMATION)
    cipher.init(Cipher.ENCRYPT_MODE, secretKey())
    val ciphertext = cipher.doFinal(database.toString().toByteArray(Charsets.UTF_8))
    val envelope = JSONObject()
      .put("version", 1)
      .put("iv", Base64.encodeToString(cipher.iv, Base64.NO_WRAP))
      .put("ciphertext", Base64.encodeToString(ciphertext, Base64.NO_WRAP))
    val file = storageFile()
    val temporary = File(file.parentFile, "$FILE_NAME.tmp")
    FileOutputStream(temporary).use { output ->
      output.write(envelope.toString().toByteArray(Charsets.UTF_8))
      output.fd.sync()
    }
    // Atomic same-filesystem replacement preserves the previous valid file
    // if writing the next encrypted database is interrupted.
    Os.rename(temporary.absolutePath, file.absolutePath)
  }
}
