import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Building, FileText, Plus, Edit3 } from "lucide-react";

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <Building className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                PlanTech Pro
              </h1>
            </div>
            <Link to="/projects">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-all duration-200 transform hover:scale-105">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Projet
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Améliorez vos plans d'immeubles
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Importez, annotez et modifiez vos plans CAD/DWG avec des outils professionnels 
            adaptés aux techniciens du bâtiment.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="text-center">
              <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle className="text-xl text-gray-900 dark:text-white">
                Import de Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Importez vos plans CAD/DWG, PDF ou images directement depuis votre appareil
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="text-center">
              <Edit3 className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-xl text-gray-900 dark:text-white">
                Outils d'Annotation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Dessinez, annotez et ajoutez des mesures avec des outils précis
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="text-center">
              <Building className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle className="text-xl text-gray-900 dark:text-white">
                Gestion de Projets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Organisez vos projets et suivez l'évolution de vos modifications
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Link to="/projects">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg">
              Commencer Maintenant
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Home;