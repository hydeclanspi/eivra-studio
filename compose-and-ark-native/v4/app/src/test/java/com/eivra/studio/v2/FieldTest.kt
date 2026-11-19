package com.eivra.studio.v2
import com.eivra.studio.v2.api.Route
import com.eivra.studio.v2.ui.Field
import com.eivra.studio.v2.ui.fieldFor
import org.junit.Assert.assertEquals
import org.junit.Test
class FieldTest {
    @Test fun routeDefaultsMatchPublicWeb(){
        val expected=mapOf(Field.Sand to setOf(Route.Portfolio), Field.Hongguo to setOf(Route.Settle,Route.Console), Field.Daylight to setOf(Route.History), Field.Moon to setOf(Route.New,Route.Dashboard,Route.Analysis,Route.Metrics,Route.Seasons,Route.Teams,Route.Quants))
        assertEquals(expected, Route.entries.groupBy(::fieldFor).mapValues{it.value.toSet()})
    }
}
