package com.eivra.studio.v2.ledger

import androidx.compose.runtime.*
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

// Retain only edit state, never a workspace/ledger. Each host destination gets its own session.
internal class EditSession(private val scope: CoroutineScope, private val saved: SavedStateHandle) {
    var ticket by mutableStateOf(Ticket()); private set
    var ready by mutableStateOf(false); private set
    var loading by mutableStateOf(false); private set
    var writing by mutableStateOf(false); private set
    var parsing by mutableStateOf(false); private set
    var parsed by mutableStateOf<Parsed?>(null); private set
    var message by mutableStateOf(""); private set
    var receipt by mutableStateOf(saved.get<String>("receipt")); private set
    private var stableId = saved.get<String>("requestId") ?: "inv_${uid()}".also { saved["requestId"]=it }
    private var editVersion=0L
    private var parser: Job?=null
    fun enter(g: LedgerGateway, source: String?) {
        if(ready || loading || receipt!=null) return
        val id=saved.get<String>("checkpoint") ?: source
        if(id==null){ ready=true; return }
        loading=true; message=""
        scope.launch {
            try { ticket=g.load(id); ready=true }
            catch(e: CancellationException){throw e}
            catch(e: Exception){ message="草稿未载入：${e.message}" }
            finally { loading=false }
        }
    }
    fun edit(next: Ticket) {
        if(writing || !ready || receipt!=null || next==ticket) return
        ticket=next; editVersion++; parsed=null; message=""; parser?.cancel(); parsing=false
    }
    fun leg(i: Int, f: (Leg)->Leg) = edit(ticket.copy(legs=ticket.legs.at(i,f)))
    fun parse(g: LedgerGateway) {
        if(!ready || writing || parsing || receipt!=null || ticket.quick.isBlank()) return
        val version=editVersion; val text=ticket.quick; parsing=true; message=""; parsed=null
        parser=scope.launch {
            try { val p=g.parse(text); if(editVersion==version && !writing) parsed=p }
            catch(e: CancellationException){throw e}
            catch(e: Exception){if(editVersion==version) message="未能解析：${e.message}"}
            finally {if(editVersion==version) parsing=false}
        }
    }
    fun acceptParsed(){ val p=parsed ?: return; edit(ticket.copy(legs=p.ticket.legs,amount=p.ticket.amount.ifBlank { ticket.amount })); parsed=null }
    fun dismissParsed(){ parsed=null }
    fun submit(g: LedgerGateway, checkpoint: Boolean=false) {
        if(!ready || writing || receipt!=null) return
        val captured=ticket
        if(!checkpoint) captured.issue(true)?.let { message=it; return }
        writing=true; message=""; editVersion++; parser?.cancel(); parsing=false; parsed=null
        scope.launch {
            try {
                if(checkpoint){val id=g.checkpoint(captured); saved["checkpoint"]=id; message="草稿已保存 · $id"}
                else {val clockKey="created:$stableId"; val stamp=saved.get<String>(clockKey) ?: java.time.Instant.now().toString().also { saved[clockKey]=it }; val id=g.save(captured,stableId,stamp); saved.remove<String>(clockKey); saved["receipt"]=id; receipt=id; saved.remove<String>("checkpoint")}
            }catch(e: CancellationException){throw e}
            catch(e: Exception){message="没有取得有效回执：${e.message}"}
            finally{writing=false}
        }
    }
    fun another(){ if(writing || receipt==null) return; saved.remove<String>("receipt"); saved.remove<String>("checkpoint"); stableId="inv_${uid()}"; saved["requestId"]=stableId; receipt=null;ticket=Ticket(); editVersion++; ready=true; message="" }
}
internal class NewEditorViewModel(saved: SavedStateHandle): ViewModel() { val editor=EditSession(viewModelScope,saved) }

internal class SettlementSession(private val scope: CoroutineScope, private val saved: SavedStateHandle) {
    var target by mutableStateOf<Stored?>(null); private set
    var form by mutableStateOf<ResultForm?>(null); private set
    var writing by mutableStateOf(false); private set
    var message by mutableStateOf(""); private set
    var receipt by mutableStateOf(saved.get<String>("settled")); private set
    fun open(row: Stored) {
        if(target!=null || receipt!=null) return
        target=row; form=row.initial
    }
    fun reset(row: Stored) { if(!writing && receipt==null) { target=row; form=row.initial; message="" } }
    fun edit(f: ResultForm){if(!writing && receipt==null){form=f;message=""}}
    fun submit(g: LedgerGateway){
        val r=target?:return; val f=form?:return
        if(writing || receipt!=null) return
        f.issue()?.let { message=it; return }; writing=true; message=""
        scope.launch {
            try {val id=g.settle(r,f);saved["settled"]=id;receipt=id}
            catch(e: CancellationException){throw e}
            catch(e: Exception){message="没有取得结算回执：${e.message}"}
            finally{writing=false}
        }
    }
}
internal class SettleEditorViewModel(saved: SavedStateHandle): ViewModel() {val editor=SettlementSession(viewModelScope,saved)}
